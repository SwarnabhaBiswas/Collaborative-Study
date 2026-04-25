import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import helmet from "helmet";
import { Server } from "socket.io";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";

import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

import Message from "./models/Message.js";

dotenv.config();

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : [];

const app = express();

/* -------------------- MIDDLEWARE -------------------- */
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(helmet());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use("/api/auth", limiter);

/* -------------------- DB -------------------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Database connected"))
  .catch(console.log);

/* -------------------- REDIS -------------------- */
const pubClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

const subClient = pubClient.duplicate();

await pubClient.connect();
await subClient.connect();

pubClient.on("error", (err) => console.log("Redis Client Error", err));
subClient.on("error", (err) => console.log("Redis Sub Error", err));

/* -------------------- ROUTES -------------------- */
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running");
});

/* -------------------- SERVER -------------------- */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.adapter(createAdapter(pubClient, subClient));

/* -------------------- SOCKET AUTH -------------------- */
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Unauthorized"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // CRITICAL: Ensure you use the same ID key as your login/auth route provides
    socket.user = decoded; 
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

/* -------------------- TIMER INTERVAL TRACKER -------------------- */
const activeTimers = {};

/* -------------------- SOCKET EVENTS -------------------- */
io.on("connection", (socket) => {
  // Log the connection
  console.log(`User connected: ${socket.user.username} (${socket.id})`);

  /* ---------- JOIN ROOM ---------- */
  socket.on("join_room", async ({ roomId }) => {
    console.log(`User ${socket.user.username} joining room: ${roomId}`);
    const userId = (socket.user.id || socket.user._id).toString();
    const username = socket.user.username;

    socket.roomId = roomId;
    socket.userId = userId;
    // Store data directly on the socket for reliable retrieval
    socket.data.userId = userId;
    socket.data.username = username;
    
    socket.join(roomId);

    // HELPER: Safely fetch users in a room (prevents crash on Redis timeout)
    const getRoomUsers = async (targetRoomId) => {
      try {
        const connectedSockets = await io.in(targetRoomId).fetchSockets();
        const uniqueUsersMap = new Map();
        
        connectedSockets.forEach((s) => {
          if (s.data.userId && !uniqueUsersMap.has(s.data.userId)) {
            uniqueUsersMap.set(s.data.userId, {
              socketId: s.id,
              userId: s.data.userId,
              username: s.data.username,
            });
          }
        });
        return Array.from(uniqueUsersMap.values());
      } catch (err) {
        console.error("fetchSockets timeout or error, using local fallback:", err.message);
        // Fallback to local server sockets only if Redis adapter times out
        const localSockets = await io.of("/").in(targetRoomId).allSockets();
        const users = [];
        for (const sId of localSockets) {
          const s = io.sockets.sockets.get(sId);
          if (s?.data?.userId) {
            users.push({
              socketId: s.id,
              userId: s.data.userId,
              username: s.data.username,
            });
          }
        }
        return users;
      }
    };

    // Check if this USER (any tab) is already in the room
    const currentUsers = await getRoomUsers(roomId);
    const isUserAlreadyIn = currentUsers.some(u => u.userId === userId && u.socketId !== socket.id);

    // Only notify if this is the first tab for this user
    if (!isUserAlreadyIn) {
      io.to(roomId).emit("notify", {
        type: "user_joined",
        message: `${username} joined the room`,
      });
    }

    console.log(`Emitting unique users to ${roomId}:`, currentUsers);
    io.to(roomId).emit("update_users", currentUsers);
  });

  /* ---------- LEAVE ROOM ---------- */
  socket.on("leave_room", async ({ roomId }) => {
    if (roomId) {
      console.log(`User ${socket.user.username} leaving room: ${roomId}`);
      const userId = socket.userId;
      socket.leave(roomId);

      // Re-use the safe helper
      const getRoomUsers = async (targetRoomId) => {
        try {
          const connectedSockets = await io.in(targetRoomId).fetchSockets();
          const uniqueUsersMap = new Map();
          connectedSockets.forEach((s) => {
            if (s.data.userId && !uniqueUsersMap.has(s.data.userId)) {
              uniqueUsersMap.set(s.data.userId, {
                socketId: s.id,
                userId: s.data.userId,
                username: s.data.username,
              });
            }
          });
          return Array.from(uniqueUsersMap.values());
        } catch (err) {
          return []; // Fallback to empty if both fail during leave
        }
      };

      const updatedUsers = await getRoomUsers(roomId);
      const isStillIn = updatedUsers.some((u) => u.userId === userId);

      io.to(roomId).emit("update_users", updatedUsers);

      if (!isStillIn) {
        io.to(roomId).emit("notify", {
          type: "user_left",
          message: `${socket.user.username} left the room`,
        });
      }
    }
  });

  /* ---------- CHAT ---------- */
  socket.on("send_message", async (data) => {
    if (!data.message?.trim()) return;

    const messageData = {
      roomId: data.roomId,
      message: data.message,
      time: data.time,
      username: socket.user.username,
      senderId: (socket.user.id || socket.user._id).toString(),
    };

    await Message.create(messageData);
    io.to(data.roomId).emit("receive_message", messageData);
  });

  /* ---------- TIMER LOGIC ---------- */
  socket.on("start_timer", async ({ roomId, duration }) => {
    const key = `room:${roomId}:timer`;
    const existing = await pubClient.get(key);
    if (existing && activeTimers[roomId]) return;

    let timeLeft = duration || 25 * 60;
    await pubClient.set(key, JSON.stringify({ timeLeft, initialTime: timeLeft }));

    io.to(roomId).emit("notify", { type: "timer", message: "Timer started" });

    activeTimers[roomId] = setInterval(async () => {
      const dataStr = await pubClient.get(key);
      if (!dataStr) return;
      const data = JSON.parse(dataStr);

      data.timeLeft--;
      await pubClient.set(key, JSON.stringify(data));
      io.to(roomId).emit("timer_update", data);

      if (data.timeLeft <= 0) {
        clearInterval(activeTimers[roomId]);
        delete activeTimers[roomId];
        await pubClient.del(key);
      }
    }, 1000);
  });

  socket.on("pause_timer", async (roomId) => {
    if (activeTimers[roomId]) {
      clearInterval(activeTimers[roomId]);
      delete activeTimers[roomId];
    }
    io.to(roomId).emit("notify", { type: "timer", message: "Timer paused" });
  });

  socket.on("stop_timer", async (roomId) => {
    if (activeTimers[roomId]) {
      clearInterval(activeTimers[roomId]);
      delete activeTimers[roomId];
    }
    await pubClient.del(`room:${roomId}:timer`);
    io.to(roomId).emit("timer_update", { timeLeft: 0, initialTime: 1 });
    io.to(roomId).emit("notify", { type: "timer", message: "Timer reset" });
  });

  /* ---------- DISCONNECT ---------- */
  socket.on("disconnect", async () => {
    const roomId = socket.roomId;
    const userId = socket.userId;

    if (roomId && userId) {
      console.log(`User ${socket.user.username} disconnected from room: ${roomId}`);
      
      // Re-use the safe helper
      const getRoomUsers = async (targetRoomId) => {
        try {
          const connectedSockets = await io.in(targetRoomId).fetchSockets();
          const uniqueUsersMap = new Map();
          connectedSockets.forEach((s) => {
            if (s.data.userId && !uniqueUsersMap.has(s.data.userId)) {
              uniqueUsersMap.set(s.data.userId, {
                socketId: s.id,
                userId: s.data.userId,
                username: s.data.username,
              });
            }
          });
          return Array.from(uniqueUsersMap.values());
        } catch (err) {
          return [];
        }
      };

      const updatedUsers = await getRoomUsers(roomId);
      const isStillIn = updatedUsers.some((u) => u.userId === userId);

      io.to(roomId).emit("update_users", updatedUsers);

      // Only notify if the user has completely left (no more tabs)
      if (!isStillIn) {
        io.to(roomId).emit("notify", {
          type: "user_left",
          message: `${socket.user.username} left the room`,
        });
      }
    }
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

/* -------------------- ERROR HANDLER -------------------- */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

/* -------------------- START -------------------- */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("Server listening on PORT", PORT);
});

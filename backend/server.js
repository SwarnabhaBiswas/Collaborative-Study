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
import { completeStudySession } from "./services/analyticsService.js";

dotenv.config();

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((origin) =>
      origin.trim().replace(/\/$/, "")
    )
  : [];

const app = express();
mongoose.set("bufferCommands", false);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin.replace(/\/$/, ""))) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(helmet());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use("/api/auth", limiter);

const connectDatabase = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing");
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log("Database connected");
};

const pubClient = createClient({
  url: process.env.REDIS_URL,
});

const subClient = pubClient.duplicate();
let redisConnected = false;

const connectRedis = async () => {
  if (!process.env.REDIS_URL) {
    console.log("REDIS_URL is missing, starting without Redis adapter");
    return;
  }

  await pubClient.connect();
  await subClient.connect();
  redisConnected = true;
  console.log("Redis connected");
};

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Unauthorized"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.user = decoded;
    socket.userId = decoded.id;
    socket.data.userId = decoded.id;
    socket.data.username = decoded.username;

    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

const activeTimers = {};

const buildRoomUsers = async (roomId) => {
  const sockets = await io.in(roomId).fetchSockets();
  const usersMap = new Map();

  sockets.forEach((roomSocket) => {
    const userId = roomSocket.data.userId;
    const username = roomSocket.data.username;

    if (!userId) return;

    usersMap.set(userId, {
      userId,
      username,
    });
  });

  return Array.from(usersMap.values());
};

const emitRoomUsers = async (roomId) => {
  const users = await buildRoomUsers(roomId);
  io.to(roomId).emit("update_users", users);
};

const emitNotification = (roomId, type, message) => {
  const notificationId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  io.to(roomId).emit("notify", {
    id: notificationId,
    type,
    message,
    timestamp: new Date().toISOString(),
  });
};

io.on("connection", (socket) => {
  console.log("User Connected", socket.id);

  socket.on("join_room", async ({ roomId }) => {
    socket.roomId = roomId;
    socket.join(roomId);

    await emitRoomUsers(roomId);

    emitNotification(
      roomId,
      "user_joined",
      `${socket.user.username} joined the room`
    );
  });

  socket.on("leave_room", async ({ roomId }) => {
    socket.leave(roomId);

    await emitRoomUsers(roomId);

    emitNotification(
      roomId,
      "user_left",
      `${socket.user.username} left the room`
    );

    socket.roomId = null;
  });

  socket.on("send_message", async (data) => {
    try {
      if (!data.message?.trim()) return;

      const messageData = {
        roomId: data.roomId,
        message: data.message.trim(),
        time: data.time,
        username: socket.user.username,
        senderId: socket.userId,
      };

      await Message.create(messageData);

      io.to(data.roomId).emit("receive_message", messageData);
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("start_timer", async ({ roomId, duration }) => {
    const timerKey = `room:${roomId}:timer`;
    const sessionKey = `session:${roomId}:${socket.userId}`;

    if (activeTimers[roomId]) return;

    const existingTimer = await pubClient.get(timerKey);

    let timerData;

    if (existingTimer) {
      timerData = JSON.parse(existingTimer);
    } else {
      const timeLeft = duration || 25 * 60;

      timerData = {
        timeLeft,
        initialTime: timeLeft,
      };

      await pubClient.set(timerKey, JSON.stringify(timerData));

      const existingSession = await pubClient.get(sessionKey);
      if (!existingSession) {
        await pubClient.set(sessionKey, Date.now());
      }
    }

    emitNotification(roomId, "timer", "Timer started");

    activeTimers[roomId] = setInterval(async () => {
      const rawTimer = await pubClient.get(timerKey);

      if (!rawTimer) {
        clearInterval(activeTimers[roomId]);
        delete activeTimers[roomId];
        return;
      }

      const data = JSON.parse(rawTimer);

      data.timeLeft -= 1;

      await pubClient.set(timerKey, JSON.stringify(data));

      io.to(roomId).emit("timer_update", {
        timeLeft: data.timeLeft,
        initialTime: data.initialTime,
      });

      if (data.timeLeft <= 0) {
        const startTime = await pubClient.get(sessionKey);

        await completeStudySession({
          userId: socket.userId,
          roomId,
          startTime,
        });

        await pubClient.del(sessionKey);
        await pubClient.del(timerKey);

        clearInterval(activeTimers[roomId]);
        delete activeTimers[roomId];

        emitNotification(roomId, "timer", "Timer completed");
      }
    }, 1000);
  });

  socket.on("pause_timer", async (roomId) => {
    if (activeTimers[roomId]) {
      clearInterval(activeTimers[roomId]);
      delete activeTimers[roomId];
    }

    // Do not delete the Redis session key here.
    // Pausing is not a completed study session.

    emitNotification(roomId, "timer", "Timer paused");
  });

  socket.on("stop_timer", async (roomId) => {
    const timerKey = `room:${roomId}:timer`;
    const sessionKey = `session:${roomId}:${socket.userId}`;

    if (activeTimers[roomId]) {
      clearInterval(activeTimers[roomId]);
      delete activeTimers[roomId];
    }

    const startTime = await pubClient.get(sessionKey);

    await completeStudySession({
      userId: socket.userId,
      roomId,
      startTime,
    });

    await pubClient.del(sessionKey);
    await pubClient.del(timerKey);

    io.to(roomId).emit("timer_update", {
      timeLeft: 0,
      initialTime: 1,
    });

    emitNotification(roomId, "timer", "Timer reset");
  });

  socket.on("disconnect", async () => {
    console.log("User Disconnected", socket.id);

    const roomId = socket.roomId;
    if (!roomId) return;

    await emitRoomUsers(roomId);

    emitNotification(
      roomId,
      "user_left",
      `${socket.user.username} left the room`
    );
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;

try {
  await connectDatabase();

  try {
    await connectRedis();
    if (redisConnected) {
      io.adapter(createAdapter(pubClient, subClient));
    }
  } catch (err) {
    console.error(
      "Redis connection failed, starting without Redis adapter:",
      err.message
    );
  }

  server.listen(PORT, () => {
    console.log("Server listening on PORT", PORT);
  });
} catch (err) {
  console.error("Server startup failed:", err.message);
  process.exit(1);
}

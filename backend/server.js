import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

import Message from "./models/Message.js";

dotenv.config();
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
  : [];

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like Postman, mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Database connected"))
  .catch((err) => console.log(err));

const roomStates = {};
const rooms = {}; // presence system

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

io.on("connection", (socket) => {
  console.log("User Connected", socket.id);

  //  JOIN ROOM (FIXED)
  socket.on("join_room", ({ roomId, username }) => {
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    // prevent duplicate
    const exists = rooms[roomId].some((user) => user.socketId === socket.id);

    if (!exists) {
      rooms[roomId].push({
        socketId: socket.id,
        username,
      });
    }

    io.to(roomId).emit("update_users", rooms[roomId]);
    io.to(roomId).emit("notify", {
      type: "user_joined",
      message: `${username} joined the room`,
    });

    console.log(`${username} joined ${roomId}`);
  });

  // 💬 CHAT
  socket.on("send_message", async (data) => {
    try {
      // SAVE TO DB
      await Message.create(data);

      // SEND TO OTHERS
      socket.to(data.roomId).emit("receive_message", data);
    } catch (err) {
      console.log(err);
    }
  });

  // ⏱️ TIMER
  socket.on("start_timer", ({ roomId, duration }) => {
    if (roomStates[roomId]?.interval) return;

    let timeLeft = roomStates[roomId]?.timeLeft || duration || 25 * 60;
    const initialTime = roomStates[roomId]?.initialTime || timeLeft;

    // EMIT ONLY ONCE HERE
    io.to(roomId).emit("notify", {
      type: "timer",
      message: "Timer started",
    });

    roomStates[roomId] = {
      timeLeft,
      initialTime,
      interval: setInterval(() => {
        roomStates[roomId].timeLeft--;

        io.to(roomId).emit("timer_update", {
          timeLeft: roomStates[roomId].timeLeft,
          initialTime: roomStates[roomId].initialTime,
        });

        if (roomStates[roomId].timeLeft <= 0) {
          clearInterval(roomStates[roomId].interval);
          delete roomStates[roomId];
        }
      }, 1000),
    };
  });

  socket.on("pause_timer", (roomId) => {
    if (roomStates[roomId]?.interval) {
      clearInterval(roomStates[roomId].interval);
      roomStates[roomId].interval = null;
    }

    io.to(roomId).emit("notify", {
      type: "timer",
      message: "Timer paused",
    });
  });

  socket.on("stop_timer", (roomId) => {
    if (roomStates[roomId]) {
      clearInterval(roomStates[roomId].interval);
      delete roomStates[roomId];

      io.to(roomId).emit("timer_update", {
        timeLeft: 0,
        initialTime: 1,
      });

      io.to(roomId).emit("notify", {
        type: "timer",
        message: "Timer reset",
      });
    }
  });

  // ❗ DISCONNECT
  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);

    for (const roomId in rooms) {
      const user = rooms[roomId].find((u) => u.socketId === socket.id);

      rooms[roomId] = rooms[roomId].filter(
        (user) => user.socketId !== socket.id,
      );

      io.to(roomId).emit("update_users", rooms[roomId]);

      if (user) {
        io.to(roomId).emit("notify", {
          type: "user_left",
          message: `${user.username} left the room`,
        });
      }
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("Server listening on PORT", PORT);
});

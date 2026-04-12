import Room from "../models/Room.js";
import crypto from "crypto";

const generateRoomId = () => {
  return crypto.randomBytes(4).toString("hex");
};

export const createRoom = async (req, res) => {
  try {
    const userId = req.user.id;
    const roomId = generateRoomId();

    const room = await Room.create({
      roomId,
      users: [userId],
      createdBy: userId,
    });

    res.status(201).json({
      message: "Room created",
      room,
    });
  } catch (e) {
    res.status(500).json({
      message: e.message,
    });
  }
};

export const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.body;
    const userId = req.user.id;

    const room = await Room.findOne({ roomId });

    if (!room) {
      res.status(404).json({ message: "Invalid room id" });
    }
    if (!room.users.some((id) => id.equals(userId))) {
      room.users.push(userId);
      await room.save();
    }

    res.json({
        message:"Joined room",
        room,
    })

  } catch (e) {
    res.status(500).json({
      message: e.message,
    });
  }
};

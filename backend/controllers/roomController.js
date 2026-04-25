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

    return res.status(201).json({
      success: true,
      message: "Room created",
      room,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
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
      return res.status(404).json({
        success: false,
        message: "Invalid room id",
      });
    }

    if (!room.users.some((id) => id.toString() === userId)) {
      room.users.push(userId);
      await room.save();
    }

    return res.json({
      success: true,
      message: "Joined room",
      room,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

export const getMyRooms = async (req, res) => {
  try {
    const rooms = await Room.find({
      $or: [{ createdBy: req.user.id }, { users: req.user.id }],
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: rooms,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // only creator can delete
    if (room.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await Room.deleteOne({ roomId });

    return res.json({
      success: true,
      message: "Room deleted",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

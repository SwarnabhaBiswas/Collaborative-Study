import express from "express";
import { createRoom, joinRoom, getMyRooms, deleteRoom } from "../controllers/roomController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", protect, createRoom);
router.post("/join", protect, joinRoom);
router.get("/my", protect, getMyRooms);
router.delete("/:roomId", protect, deleteRoom);

export default router;
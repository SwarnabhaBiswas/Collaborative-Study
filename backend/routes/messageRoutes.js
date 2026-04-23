import { getMessages } from "../controllers/messageController.js";
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';

const router= express.Router();

router.get('/:roomId', protect, getMessages);

export default router;
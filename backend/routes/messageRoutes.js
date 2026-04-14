import { getMessages } from "../controllers/messageController.js";
import express from 'express';

const router= express.Router();

router.get('/:roomId',getMessages);

export default router;
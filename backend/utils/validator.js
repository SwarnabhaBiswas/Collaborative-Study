import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const messageSchema = z.object({
  roomId: z.string().min(1, "Room ID is required"),
  message: z.string().min(1, "Message cannot be empty"),
});

export const roomSchema = z.object({
  name: z.string().min(3, "Room name must be at least 3 characters long"),
});

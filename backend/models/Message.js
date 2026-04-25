import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      trim:true,
    },
    senderId: {
      type: String,
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim:true,
    },
    time: {
      type: String,
    },
  },
  { timestamps: true }
);
//indexing to find and sort chats faster when there is lot of chats
messageSchema.index({ roomId: 1, createdAt: 1 });

export default mongoose.model("Message", messageSchema);
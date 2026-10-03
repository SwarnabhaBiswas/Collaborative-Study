import mongoose from "mongoose"; 

const userStatsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Added quotes
      required: true,
      unique: true,
    },
    totalFocusMinutes: { type: Number, default: 0 },
    totalSessions: { type: Number, default: 0 },
    longestSessionMinutes: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastStudyDate: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("UserStats", userStatsSchema); 

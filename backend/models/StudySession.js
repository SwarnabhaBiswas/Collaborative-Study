import mongoose from "mongoose";

const studySessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        roomId: {
            type: String,
            required: true,
        },

        durationMinutes: {
            type: Number,
            required: true,
        },

        completedAt: {
            type: Date,
            default: Date.now,
        },

        messagesSent: {
            type: Number,
            default: 0,
        },
        roomName: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("StudySession", studySessionSchema);
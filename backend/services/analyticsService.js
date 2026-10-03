import UserStats from "../models/UserStats.js";
import StudySession from "../models/StudySession.js";

const MINIMUM_SESSION_MINUTES = 5;

export const initializeUserStats = async (userId) => {
  let stats = await UserStats.findOne({ userId });

  if (!stats) {
    stats = await UserStats.create({
      userId,
    });
  }

  return stats;
};

export const completeStudySession = async ({
  userId,
  roomId,
  roomName = "",
  startTime,
  messagesSent = 0,
}) => {
  // Safety check
  if (!startTime) return;

  const durationMinutes = Math.floor(
    (Date.now() - Number(startTime)) / 60000
  );

  // Ignore accidental / very short sessions
  if (durationMinutes < MINIMUM_SESSION_MINUTES) {
    return;
  }

  // Save study session
  await StudySession.create({
    userId,
    roomId,
    roomName,
    durationMinutes,
    messagesSent,
    completedAt: new Date(),
  });

  // Get or create user stats
  const stats = await initializeUserStats(userId);

  stats.totalFocusMinutes += durationMinutes;
  stats.totalSessions += 1;

  if (durationMinutes > stats.longestSessionMinutes) {
    stats.longestSessionMinutes = durationMinutes;
  }

  /* ---------- STREAK LOGIC ---------- */

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  if (!stats.lastStudyDate) {
    stats.currentStreak = 1;
  } else {
    const lastStudy = new Date(stats.lastStudyDate);

    lastStudy.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (today - lastStudy) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      // already counted today
    } else if (diffDays === 1) {
      stats.currentStreak += 1;
    } else {
      stats.currentStreak = 1;
    }
  }

  if (stats.currentStreak > stats.longestStreak) {
    stats.longestStreak = stats.currentStreak;
  }

  stats.lastStudyDate = today;

  await stats.save();

  return stats;
};
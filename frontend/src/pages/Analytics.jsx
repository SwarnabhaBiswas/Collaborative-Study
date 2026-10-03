import { useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const MetricCard = ({ title, description, children }) => {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 backdrop-blur-md">
      <div className="mb-5">
        <h2 className="text-primary font-bold text-lg">{title}</h2>
        <p className="text-gray-400 text-sm mt-1">{description}</p>
      </div>
      {children}
    </div>
  );
};

const StatBlock = ({ label, value, helper }) => {
  return (
    <div className="bg-tertiary rounded-2xl p-4">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-primary text-3xl md:text-4xl font-black mt-2">
        {value}
      </p>
      {helper && <p className="text-gray-400 text-xs mt-2">{helper}</p>}
    </div>
  );
};

function Analytics() {
  const { logout, user } = useAuth();

  const [analyticsData] = useState({
    chatActivity: {
      sent: 1240,
      received: 1388,
    },
    roomHistory: {
      created: 18,
      joined: 42,
    },
    productivity: {
      studyTime: "76h 30m",
      pomodoroSessions: 184,
    },
    timeDistribution: [
      { label: "Days 1-7", activeDays: 6, activeTime: "14h 10m" },
      { label: "Days 8-14", activeDays: 5, activeTime: "18h 45m" },
      { label: "Days 15-21", activeDays: 7, activeTime: "21h 20m" },
      { label: "Days 22-30+", activeDays: 8, activeTime: "22h 15m" },
    ],
    aiSummary: {
      title: "Gemini Session Summary",
      status: "Frontend placeholder",
      intro:
        "This space will show a generated study summary once the frontend receives Gemini response text from your API.",
      bullets: [
        "Most productive rooms and study windows will appear here.",
        "Repeated discussion topics and blockers will be summarized here.",
        "Session-level focus patterns and follow-up suggestions will map here.",
      ],
      apiNote:
        "Needed from API: generated summary text, key insights, suggested next steps, and the date range used for the calculation.",
    },
  });

  return (
    <div className="min-h-screen bg-background text-primary">
      <Navbar logout={logout} />

      <main className="w-[90%] max-w-6xl mx-auto py-8 md:py-12">
        <div className="mb-8">
          <div className="bg-white/5 border border-white/10 px-4 py-1 rounded-full text-sm inline-flex">
            <span className="text-sm opacity-80">
              Analytics for {user?.username || "your study sessions"}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold mt-5">
            Study Analytics
          </h1>
          <p className="text-gray-400 mt-3 max-w-2xl">
            A focused view of chat activity, room history, time spent studying,
            and future AI-generated session insights.
          </p>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
          <MetricCard
            title="Chat Activity"
            description="Messages exchanged across rooms"
          >
            <div className="grid grid-cols-2 gap-3">
              <StatBlock label="Sent" value={analyticsData.chatActivity.sent} />
              <StatBlock
                label="Received"
                value={analyticsData.chatActivity.received}
              />
            </div>
          </MetricCard>

          <MetricCard
            title="Room History"
            description="Rooms created locally and joined"
          >
            <div className="grid grid-cols-2 gap-3">
              <StatBlock
                label="Created"
                value={analyticsData.roomHistory.created}
              />
              <StatBlock label="Joined" value={analyticsData.roomHistory.joined} />
            </div>
          </MetricCard>

          <MetricCard
            title="Productivity Overall"
            description="Study time and completed Pomodoros"
          >
            <div className="grid grid-cols-1 gap-3">
              <StatBlock
                label="Study Time"
                value={analyticsData.productivity.studyTime}
              />
              <StatBlock
                label="Pomodoros"
                value={analyticsData.productivity.pomodoroSessions}
              />
            </div>
          </MetricCard>

          <MetricCard
            title="Time Distribution"
            description="Active days and time in monthly buckets"
          >
            <div className="space-y-3">
              {analyticsData.timeDistribution.map((bucket) => (
                <div
                  key={bucket.label}
                  className="bg-tertiary rounded-2xl p-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-primary font-semibold">{bucket.label}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {bucket.activeDays} active days
                    </p>
                  </div>
                  <p className="text-primary font-bold text-xl shrink-0">
                    {bucket.activeTime}
                  </p>
                </div>
              ))}
            </div>
          </MetricCard>
        </section>

        <section className="mt-8 md:mt-10 bg-secondary rounded-2xl border border-white/10 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <p className="text-gray-400 text-sm">
                {analyticsData.aiSummary.status}
              </p>
              <h2 className="text-2xl md:text-3xl font-bold mt-1">
                {analyticsData.aiSummary.title}
              </h2>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-gray-400">
              Gemini API ready area
            </div>
          </div>

          <div className="bg-tertiary rounded-2xl p-5 md:p-6">
            <p className="text-gray-300 leading-7">
              {analyticsData.aiSummary.intro}
            </p>

            <ul className="mt-5 space-y-3">
              {analyticsData.aiSummary.bullets.map((item) => (
                <li key={item} className="flex gap-3 text-gray-300">
                  <span className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 border border-white/10 rounded-2xl p-4 bg-background">
              <p className="text-primary font-semibold mb-2">
                Frontend note
              </p>
              <p className="text-gray-400 text-sm leading-6">
                {analyticsData.aiSummary.apiNote}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Analytics;

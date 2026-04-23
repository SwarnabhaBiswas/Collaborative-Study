import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { socket } from "../socket";
import Message from "../components/Message";
import TimerInput from "../components/TimerInput";
import Users from "../components/Users";
import Notifications from "../components/Notifications";
import { useAuth } from "../context/AuthContext";
import { User, Timer } from "lucide-react";

function Room() {
  const { roomId } = useParams();

  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const [time, setTime] = useState(1500);
  const [initialTime, setInitialTime] = useState(1500);
  const [durationInput, setDurationInput] = useState(25);
  const [isPaused, setIsPaused] = useState(true);

  const [notifications, setNotifications] = useState([]);

  // 🔥 MOBILE SIDEBARS
  const [showUsers, setShowUsers] = useState(false);
  const [showTimer, setShowTimer] = useState(false);

  const { user, token } = useAuth();
  const username = user?.username || "Guest";
  const currentUserId = user?.id;

  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 🔔 Notifications
  useEffect(() => {
    socket.on("notify", (data) => {
      const id = Date.now();
      setNotifications((prev) => [...prev, { ...data, id }]);

      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 3500);
    });

    return () => socket.off("notify");
  }, []);

  // 👥 Users
  useEffect(() => {
    socket.on("update_users", (usersList) => {
      setUsers(usersList);
    });

    return () => socket.off("update_users");
  }, []);

  // 🚪 Join Room
  useEffect(() => {
    if (!roomId || !user) return;

    socket.emit("join_room", { roomId });

    return () => {
      // Optional: emit a leave_room event if backend supports it
    };
  }, [roomId, user]);

  // 💬 Chat + Timer
  useEffect(() => {
    socket.on("receive_message", (data) => {
      setChat((prev) => [...prev, data]);
    });

    socket.on("timer_update", ({ timeLeft, initialTime }) => {
      setTime(timeLeft);
      setInitialTime(initialTime);
      setIsPaused(timeLeft <= 0);
    });

    return () => {
      socket.off("receive_message");
      socket.off("timer_update");
    };
  }, []);

  // 📦 Load messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/messages/${roomId}`,
          {
            headers: {
              Authorization: token,
            },
          },
        );

        const data = await res.json();

        if (res.ok) {
          setChat(data.data);
        } else {
          console.error(data.message);
        }
      } catch (err) {
        console.log(err);
      }
    };

    fetchMessages();
  }, [roomId]);

  useEffect(scrollToBottom, [chat]);

  // 💬 Send Message
  const sendMessage = () => {
    if (!message.trim()) return;

    const messageData = {
      roomId,
      message,
      username,
      senderId: currentUserId,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    socket.emit("send_message", messageData);
    setMessage("");
  };

  // ⏱️ Timer Controls
  const startTimer = () => {
    socket.emit("start_timer", {
      roomId,
      duration: durationInput * 60,
    });
    setIsPaused(false);
  };

  const pauseTimer = () => {
    socket.emit("pause_timer", roomId);
    setIsPaused(true);
  };

  const stopTimer = () => {
    socket.emit("stop_timer", roomId);
    setTime(0);
    setIsPaused(true);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    initialTime > 0
      ? circumference - (time / initialTime) * circumference
      : circumference;

  // 🔥 REUSABLE TIMER UI
  const TimerUI = (
    <>
      <span className="text-primary font-bold text-3xl mb-4">
        {showTimer ? "" : "Pomodoro"}
      </span>

      <div className="relative flex items-center justify-center mb-10">
        <svg className="transform -rotate-90 w-64 h-64">
          <circle
            cx="128"
            cy="128"
            r={radius}
            stroke="currentColor"
            strokeWidth="10"
            fill="transparent"
            className={isPaused ? "text-tertiary" : "text-secondary"}
          />
          <circle
            cx="128"
            cy="128"
            r={radius}
            stroke="currentColor"
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            className="text-primary"
          />
        </svg>

        <div className="absolute flex flex-col items-center">
          <h1 className="text-5xl font-black text-primary">
            {formatTime(time)}
          </h1>
          <p className="text-xs text-gray-400">
            {isPaused ? "Paused" : "Focusing"}
          </p>
        </div>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <TimerInput value={durationInput} onChange={setDurationInput} />

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={isPaused ? startTimer : pauseTimer}
            className={`py-4 rounded-2xl font-bold cursor-pointer ${
              isPaused ? "bg-secondary" : "bg-tertiary"
            } text-primary`}
          >
            {isPaused ? "Start" : "Pause"}
          </button>

          <button
            onClick={stopTimer}
            className="bg-red-800 text-primary py-4 cursor-pointer rounded-2xl font-bold"
          >
            Reset
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="bg-background h-[100dvh] flex overflow-hidden relative">
      <Notifications notifications={notifications} />

      {/* DESKTOP USERS */}
      <div className="w-80 hidden lg:flex bg-background p-6 flex-col">
        <h2 className="text-xl text-primary font-bold mb-6">Users</h2>
        <Users users={users} socket={socket} />
      </div>

      {/* CHAT */}
      <div 
      id="chatBox"
      className="flex-1 flex flex-col bg-neutral-900">
        <div className="p-3 border-b border-secondary flex justify-between">
          <span className="text-primary">#{roomId}</span>

          {/* MOBILE ICONS */}
          <div className="flex gap-2 lg:hidden">
            <button onClick={() => setShowUsers(true)}>
              <User color="#ebedce" size={24} />
            </button>
            <button onClick={() => setShowTimer(true)}>
              <Timer color="#ebedce" size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-0">
          {Array.isArray(chat) &&
            chat.map((msg, index) => (
              <Message
                key={index}
                msg={msg}
                id={index}
                currentUser={currentUserId}
              />
            ))}
          <div ref={chatEndRef} />
        </div>

        <div className="p-3 flex gap-2 border-t border-secondary">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="flex-1 bg-tertiary p-3 rounded-xl"
          />
          <button
            onClick={sendMessage}
            className="bg-primary text-background px-4 rounded-xl cursor-pointer"
          >
            Send
          </button>
        </div>
      </div>

      {/* DESKTOP TIMER */}
      <div className="hidden lg:flex w-96 bg-background p-6 flex-col items-center justify-center">
        {TimerUI}
      </div>

      {/* MOBILE USERS */}
      <div
        className={`fixed left-0 top-0 h-full w-72 bg-background z-50 transform ${
          showUsers ? "translate-x-0" : "-translate-x-full"
        } transition`}
      >
        <Users users={users} socket={socket} />
      </div>

      {/* MOBILE TIMER */}
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-background z-50 transform ${
          showTimer ? "translate-x-0" : "translate-x-full"
        } transition`}
      >
        <button onClick={() => setShowTimer(false)}></button>
        {TimerUI}
      </div>
      {/* OVERLAY (click outside to close) */}
      {(showUsers || showTimer) && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => {
            setShowUsers(false);
            setShowTimer(false);
          }}
        />
      )}
    </div>
  );
}

export default Room;

import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { socket } from "../socket";
import Message from "../components/Message";
import TimerInput from "../components/TimerInput";
import Users from "../components/Users";
import Notifications from "../components/Notifications";

function Room() {
  const { roomId } = useParams();

  //User states
  const [users, setUsers] = useState([]);

  // Chat States
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  // Timer States
  const [time, setTime] = useState(1500); // Current seconds left
  const [initialTime, setInitialTime] = useState(1500); // Total seconds for percentage calc
  const [durationInput, setDurationInput] = useState(25); // User input in minutes
  const [isPaused, setIsPaused] = useState(true);

  //notification
  const [notifications, setNotifications] = useState([]);

  const usernameRef = useRef("User" + Math.floor(Math.random() * 1000));

  const username = usernameRef.current;
  const chatEndRef = useRef(null);
  const hasJoined = useRef(false);

  // Auto-scroll chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    socket.on("notify", (data) => {
      const id = Date.now();

      setNotifications((prev) => [...prev, { ...data, id }]);
      //remove noti
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 3500);
    });

    return () => {
      socket.off("notify");
    };
  }, []);

  useEffect(() => {
    socket.on("update_users", (usersList) => {
      setUsers(usersList);
    });

    return () => {
      socket.off("update_users");
    };
  }, []);

  useEffect(() => {
    if (hasJoined.current) return;

    socket.emit("join_room", {
      roomId,
      username,
    });

    hasJoined.current = true;
  }, [roomId]);

  useEffect(() => {
    // Receive Messages
    socket.on("receive_message", (data) => {
      setChat((prev) => [...prev, data]);
    });

    // Receive Timer Updates
    socket.on(
      "timer_update",
      ({ timeLeft, initialTime: serverInitialTime }) => {
        setTime(timeLeft);
        setInitialTime(serverInitialTime);
        setIsPaused(timeLeft <= 0);
      },
    );

    return () => {
      socket.off("receive_message");
      socket.off("timer_update");
    };
  }, []);

  useEffect(scrollToBottom, [chat]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const messageData = {
      roomId,
      message,
      username,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    socket.emit("send_message", messageData);
    setChat((prev) => [...prev, messageData]);
    setMessage("");
  };

  // Timer Controls
  const startTimer = () => {
    const durationInSeconds = durationInput * 60;
    socket.emit("start_timer", { roomId, duration: durationInSeconds });
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

  // SVG Circular Math
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  // If time is 0 and hasn't started, show empty circle (circumference).
  // Otherwise, calculate progress.
  const strokeDashoffset =
    initialTime > 0
      ? circumference - (time / initialTime) * circumference
      : circumference;

  return (
    <div className="bg-background h-screen flex overflow-hidden">
      <Notifications notifications={notifications}/>
      {/* LEFT - Sidebar */}
      <div className="w-80 bg-background p-6 hidden lg:flex flex-col">
        <h2 className="text-xl font-bold mb-6 text-primary">Users Room</h2>
        <Users users={users} socket={socket} />
      </div>

      {/* CENTER - Chat Interface */}
      <div className="flex-1 flex flex-col bg-linear-to-br from-neutral-900 via-[#1b1b1b] to-neutral-800">
        <div className="p-3 mb-4 border-b border-secondary flex justify-between items-center">
          <span className="font-bold text-primary uppercase bg-secondary px-2 py-0.5 border border-none rounded-xl">
            # {roomId}
          </span>
        </div>

        <div
          id="chatBox"
          className="flex-1 overflow-y-auto mb-4 space-y-2 no-scrollbar"
        >
          {chat.map((msg, index) => (
            <Message key={index} msg={msg} id={index} currentUser={username} />
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="pb-4 pr-4 pl-4">
          <div className="flex gap-2 p-1 ">
            <input
              type="text"
              placeholder="Message your group..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 px-4 py-3 outline-none text-sm bg-tertiary opacity-80 focus:opacity-100 rounded-2xl shadow-sm"
            />
            <button
              onClick={sendMessage}
              className="bg-primary text-secondary px-6 py-2 rounded-xl text-sm font-bold hover:opacity-80 transition-all active:scale-95"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT - Timer Controls */}
      <div
        className={`bg-background p-8 flex flex-col items-center justify-center `}
      >
        <span className="text-primary font-bold text-3xl">Pomodoro</span>
        <div className="relative flex items-center justify-center mb-10">
          {/* SVG Progress Ring */}
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
              style={{
                strokeDashoffset: isNaN(strokeDashoffset)
                  ? circumference
                  : strokeDashoffset,
                transition: "stroke-dashoffset 0.5s ease-in-out",
              }}
              strokeLinecap="round"
              className="text-primary"
            />
          </svg>

          {/* Digital Counter */}
          <div className="absolute flex flex-col items-center">
            <h1 className="text-5xl font-black tracking-tight text-primary">
              {formatTime(time)}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">
              {isPaused ? "Paused" : "Focusing"}
            </p>
          </div>
        </div>

        {/* Action Panel */}
        <div className="w-full max-w-xs space-y-4">
          <TimerInput value={durationInput} onChange={setDurationInput} />

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={isPaused ? startTimer : pauseTimer}
              className={`py-4 rounded-2xl font-bold transition-all active:scale-95 cursor-pointer ${
                isPaused
                  ? "bg-secondary text-primary hover:opacity-80"
                  : "bg-tertiary text-primary"
              }`}
            >
              {isPaused
                ? time < durationInput * 60 && time > 0
                  ? "Resume"
                  : "Start"
                : "Pause"}
            </button>
            <button
              onClick={stopTimer}
              className="bg-red-800 text-primary font-bold cursor-pointer py-4 rounded-2xl hover:opacity-80 transition-all active:scale-95"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Room;

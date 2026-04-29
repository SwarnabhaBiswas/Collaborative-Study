import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MyRoomsModal from "../components/MyRoomsModal";
import Navbar from "../components/Navbar";

function Dashboard() {
  const [roomId, setRoomId] = useState("");
  const [myRooms, setMyRooms] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();
  const { token, user, logout } = useAuth();

  // CREATE ROOM
  const handleCreateRoom = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/rooms/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
        navigate(`/room/${data.room.roomId}`);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.log(err);
    }
  };

  // JOIN ROOM
  const handleJoinRoom = async () => {
    const cleanRoomId = roomId.trim();
    if (!cleanRoomId) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/rooms/join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          body: JSON.stringify({ roomId: cleanRoomId }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        navigate(`/room/${cleanRoomId}`);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.log(err);
    }
  };

  // FETCH ROOMS
  useEffect(() => {
    if (!token) return;

    const fetchRooms = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/rooms/my`,
          {
            headers: {
              Authorization: token,
            },
          }
        );

        const data = await res.json();
        if (data.success) {
          setMyRooms(data.data);
        }
      } catch (err) {
        console.log(err);
      }
    };

    fetchRooms();
  }, [token]);

  return (
    <div className="min-h-screen bg-background text-primary relative overflow-hidden">
      
      {/* BACKGROUND (FIXED: no click blocking) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] via-background to-background z-0 pointer-events-none" />
      <div className="absolute bottom-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary opacity-10 blur-[140px] rounded-full z-0 pointer-events-none" />

      {/* NAVBAR (FIXED: always clickable) */}
      <div className="relative z-50">
        <Navbar logout={logout} />
      </div>

      {/* HERO */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 min-h-[calc(100vh-100px)]">
        
        {/* Badge */}
        <div className="bg-white/5 border border-white/10 px-4 py-1 rounded-full text-sm mb-6">
          <span className="text-sm opacity-80">
            Hello there! {user?.username}
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-6xl font-bold leading-tight max-w-4xl">
          Study Together.
          <br />
          <span className="opacity-80">
            Stay Focused with Real-Time Chat
          </span>
        </h1>

        {/* Subtext */}
        <p className="mt-6 text-gray-400 max-w-xl">
          Join rooms, collaborate with others, and boost productivity using
          synchronized Pomodoro sessions and live discussions.
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-col md:flex-row gap-4 items-center">
          
          {/* Create */}
          <button
            onClick={handleCreateRoom}
            className="cursor-pointer px-6 py-3 rounded-full bg-primary text-background font-semibold hover:opacity-80 transition active:scale-95"
          >
            Create Room
          </button>

          {/* Join */}
          <div className="flex gap-2 bg-white/5 border border-white/10 rounded-full p-1 backdrop-blur-md">
            <input
              type="text"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="px-4 py-2 bg-transparent outline-none text-sm w-40"
            />
            <button
              onClick={handleJoinRoom}
              className="cursor-pointer px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition text-sm active:scale-95"
            >
              Join
            </button>
          </div>
        </div>

        {/* My Rooms */}
        <button
          onClick={() => setShowModal(true)}
          className="bg-transparent cursor-pointer border border-white/10 px-6 py-2 rounded-full text-primary mt-4 backdrop-blur-md hover:opacity-80 active:scale-95"
        >
          My Rooms
        </button>

        {/* MODAL (FIXED mounting) */}
        {showModal && (
          <MyRoomsModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            myRooms={myRooms}
            setMyRooms={setMyRooms}
            user={user}
            token={token}
            navigate={navigate}
          />
        )}
      </div>
    </div>
  );
}

export default Dashboard;
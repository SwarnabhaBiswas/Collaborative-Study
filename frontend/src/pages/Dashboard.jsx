import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import MyRoomsModal from "../components/MyRoomsModal";
import Navbar from "../components/Navbar";

function Dashboard() {
  const [roomId, setRoomId] = useState("");
  const [myRooms, setMyRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(5);
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();
  const { token, user, logout } = useAuth();


  // FILTER + SORT
  const filteredRooms = myRooms
    .filter((room) =>
      room.roomId.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // DISPLAY LOGIC
  const displayedRooms = searchTerm
    ? filteredRooms // show all when searching
    : filteredRooms.slice(0, visibleCount);

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
        },
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
        },
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

  //fetch rooms

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
          },
        );

        const data = await res.json();

        setMyRooms(data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchRooms();
  }, [token]);

  return (
    <div className="h-[100dvh] bg-background text-primary relative overflow-hidden">
      {/* BACKGROUND GRADIENT GLOW */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] via-background to-background z-0" />
      <div className="absolute bottom-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary opacity-10 blur-[140px] rounded-full z-0" />

      {/* NAVBAR */}
      <Navbar logout={logout}/>

      {/* HERO */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 h-full mt-[-15%] sm:mt-[-2%]">
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
          <span className="opacity-80">Stay Focused with Real-Time Chat</span>
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
            className="px-6 py-3 rounded-full bg-primary text-background font-semibold hover:opacity-80 transition cursor-pointer"
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
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition text-sm cursor-pointer"
            >
              Join
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-transparent border border-white/10 px-6 py-2 rounded-full text-primary mt-4 backdrop-blur-md cursor-pointer hover:opacity-80"
        >
          My Rooms
        </button>
        <MyRoomsModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          myRooms={myRooms}
          setMyRooms={setMyRooms}
          user={user}
          token={token}
          navigate={navigate}
        />
      </div>
    </div>
  );
}

export default Dashboard;

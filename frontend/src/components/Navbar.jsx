import React from "react";
import { useNavigate } from "react-router-dom";


const Navbar = ({ logout }) => {
  const navigate=useNavigate();
  return (
    <div className="relative z-10 flex justify-center pt-6">
      <div
        className="w-[90%] max-w-6xl flex justify-between items-center px-6 py-3 rounded-full 
          bg-white/5 backdrop-blur-md border border-white/10 shadow-lg"
      >
        {/* LEFT */}
        <div 
        onClick={navigate("/")}
        className="flex items-center gap-3 cursor-pointer">
          <img src="/logo.png" className="w-15 h-auto mt-[-10px]" />
          <span className="text-primary font-bold text-2xl mt-1">SYNC</span>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4">
          <button
            onClick={logout}
            className="px-4 py-1 rounded-full bg-white/10 hover:bg-white/20 transition text-sm cursor-pointer active:scale-95"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;

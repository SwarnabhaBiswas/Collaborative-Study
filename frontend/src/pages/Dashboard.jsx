import { useState,useEffect } from "react";
import {useNavigate} from 'react-router-dom';

const Dashboard = ()=>{
    const [roomId,setRoomId]= useState("");
    const navigate= useNavigate();

    const handleCreateRoom=()=>{
        const id = Math.random().toString(36).substring(2, 8);
        navigate(`/room/${id}`);
    }

    const handleJoinRoom=()=>{
        if(!roomId) return;
        navigate(`/room/${id}`);
    }
    
    return(
        <div className="min-h-screen flex flex-col items-center justify-center gap-6">
            <h1 className="text-3xl font-bold">Study room</h1>

            <button
            onClick={handleCreateRoom}
            className="bg-secondary px-6 py-3 rounded-xl text-primary hover:opacity-80"
            >
                Create Room
            </button>
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="Enter room id"
                    value={roomId}
                    onChange={(e)=>setRoomId(e.target.value)}
                    className="px-4 py-2 rounded-xl text-primary bg-secondary"
                />
                <button 
                onClick={handleJoinRoom}
                className="bg-primary px-4 py-2 rounded-lg text-secondary">
                    Join
                </button>
            </div>
        </div>
    )
}

export default Dashboard;
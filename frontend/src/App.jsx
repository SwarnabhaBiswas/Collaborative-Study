import './App.css'
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { socket } from './socket';
import Dashboard from './pages/Dashboard';
import Room from './pages/Room';

function App() {
  
  useEffect(()=>{
    socket.on("connect",()=>{
      console.log("Socket connected",socket.id);
    });

    socket.on("disconnect",()=>{
      console.log("Socket disconnected");
    });

    return()=>{
      socket.off("connect");
      socket.off("disconnect");
    }
  },[]);
  
  return(
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard/>}/>
        <Route path="/room/:roomId" element={<Room/>}/>
      </Routes>
    </Router>
  )
}

export default App

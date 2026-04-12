import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import {Server} from 'socket.io';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';

dotenv.config();

const app= express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("Database connected"))
.catch((err)=>console.log(err));

app.use('/api/auth',authRoutes);
app.use('/api/rooms', roomRoutes);

app.get('/',(req,res)=>{
    res.send("Backend is running");
})

const server= http.createServer(app);

const io=new Server(server, {
    cors:{
        origin:"*"
    }
});

io.on("connection",(socket)=>{
    console.log("User Connected", socket.id);

    io.on("disconnect",()=>{
        console.log("User Disconnected");
    })
});

const PORT= process.env.PORT || 5000;

server.listen(PORT,()=>{
    console.log("Server listening on PORT",PORT);
})
import Message from "../models/Message.js";

export const getMessages= async (req,res)=>{
    try{
        const {roomId}= req.params;

        const messages= await Message.find({roomId}).sort({createdAt:1});

        res.json(messages);
    }
    catch(e){
        res.status(500).json({message:e.message})
    }
}
import mongoose from 'mongoose';

const roomSchema= new mongoose.Schema({
    roomId:{
        type:String,
        required:true,
        unique:true
    },
    users:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    ],
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
},
{timestamps:true}
);

roomSchema.index({ createdBy: 1 });

export default mongoose.model("Room",roomSchema);
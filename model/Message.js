import mongoose from "mongoose";

const MessageShema = new mongoose.Schema({
    text:{
        type: String,
        required: true,
    },
    arrayImg:{
        type: Array,
        default:[],
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
        required: true,
    }
},
{
    timestamps: true,
});

export default mongoose.model('Message', MessageShema);
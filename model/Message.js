import mongoose from "mongoose";

const MessageShema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    arrayImg: {
        type: Array,
        default: [],
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    sender: {
        type: String,
        enum: ['user', 'queen'],
        default: 'user',
        required: true,
    },
    queenName: {
        type: String,
        required: false,
    }
},
{
    timestamps: true,
});

export default mongoose.model('Message', MessageShema);
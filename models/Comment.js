import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    edit: { type: mongoose.Schema.Types.ObjectId, ref: 'Edit', required: true },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    nickname: { type: String, required: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Edit' }],
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
});

export default mongoose.model('User', userSchema);

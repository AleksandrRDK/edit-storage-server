import mongoose from 'mongoose';

const editSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        author: String,
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        video: { type: String, required: true },
        source: {
            type: String,
            enum: ['youtube', 'cloudinary'],
            required: true,
        },
        tags: [String],
        rating: {
            type: Number,
            min: 0,
            max: 11,
            required: true,
        },
    },
    { timestamps: true }
);

const Edit = mongoose.model('Edit', editSchema);
export default Edit;

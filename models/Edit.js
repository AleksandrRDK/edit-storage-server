import mongoose from 'mongoose';

const editSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        author: String,
        video: { type: String, required: true },
        tags: [String],
    },
    { timestamps: true }
);

const Edit = mongoose.model('Edit', editSchema);
export default Edit;

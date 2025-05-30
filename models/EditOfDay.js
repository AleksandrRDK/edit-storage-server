import mongoose from 'mongoose';

const editOfDaySchema = new mongoose.Schema({
    date: { type: String, required: true },
    edit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Edit',
        required: true,
    },
});

export default mongoose.model('EditOfDay', editOfDaySchema);

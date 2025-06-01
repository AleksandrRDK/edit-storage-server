import Edit from '../models/Edit.js';
import EditOfDay from '../models/EditOfDay.js';
import moment from 'moment-timezone';
import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const today = moment().tz('Europe/Moscow').format('YYYY-MM-DD');

        let existing = await EditOfDay.findOne({ date: today }).populate(
            'edit'
        );
        if (existing) return res.json(existing.edit);

        await EditOfDay.deleteMany({ date: { $lt: today } });

        const count = await Edit.countDocuments();
        const random = Math.floor(Math.random() * count);
        const randomEdit = await Edit.findOne().skip(random);

        const newEntry = new EditOfDay({ date: today, edit: randomEdit._id });
        await newEntry.save();

        res.json(randomEdit);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка при получении эдита дня' });
    }
});

export default router;

import express from 'express';
import Edit from '../models/Edit.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { search = '', tag, rating, skip = 0, limit = 8 } = req.query;

        const query = {};

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { author: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } },
            ];
        }

        if (tag && tag !== 'null') {
            query.tags = tag;
        }

        if (rating && rating !== 'null') {
            query.rating = parseInt(rating);
        }

        const total = await Edit.countDocuments(query);
        const edits = await Edit.find(query)
            .sort({ createdAt: -1 })
            .skip(Number(skip))
            .limit(Number(limit));

        res.json({ total, edits });
    } catch (err) {
        res.status(500).json({
            message: 'Ошибка поиска эдитов',
            error: err.message,
        });
    }
});

export default router;

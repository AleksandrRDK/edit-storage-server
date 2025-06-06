import express from 'express';
import Edit from '../models/Edit.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        // Агрегация для подсчёта количества эдитов по тегам
        const tagsAggregation = await Edit.aggregate([
            { $unwind: '$tags' },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        // Сформируем формат { tag: 'название', count: число }
        const tags = tagsAggregation.map(({ _id, count }) => ({
            tag: _id,
            count,
        }));

        // Общее количество эдитов (без фильтра)
        const total = await Edit.countDocuments();

        res.json({ total, tags });
    } catch (err) {
        console.error('Ошибка при получении тегов:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

export default router;

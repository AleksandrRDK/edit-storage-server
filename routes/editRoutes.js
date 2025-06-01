import express from 'express';
import Edit from '../models/Edit.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const edits = await Edit.find().sort({ date: -1 });
        res.json(edits);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка получения эдитов' });
    }
});

// пока что не используется
// router.get('/random', async (req, res) => {
//     try {
//         const randomEdit = await Edit.aggregate([{ $sample: { size: 1 } }]);
//         res.json(randomEdit[0]);
//     } catch (err) {
//         res.status(500).json({ message: 'Ошибка при получении эдита' });
//     }
// });

router.get('/random-many', async (req, res) => {
    try {
        const edits = await Edit.aggregate([{ $sample: { size: 10 } }]);
        res.json(edits);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: 'Ошибка при получении случайных эдитов',
        });
    }
});

router.get('/paginated', async (req, res) => {
    const skip = parseInt(req.query.skip) || 0;
    const limit = parseInt(req.query.limit) || 10;

    try {
        const edits = await Edit.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Edit.countDocuments();
        res.json({ edits, total });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка получения эдитов постранично' });
    }
});

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, author, video, tags, source, rating } = req.body;

        if (!title || !author || !video || !source || rating === undefined) {
            return res
                .status(400)
                .json({ message: 'Заполните все обязательные поля' });
        }

        if (!['youtube', 'cloudinary'].includes(source)) {
            return res
                .status(400)
                .json({ message: 'Некорректный источник видео (source)' });
        }

        if (typeof rating !== 'number' || rating < 0 || rating > 11) {
            return res.status(400).json({
                message: 'Рейтинг должен быть числом от 0 до 11',
            });
        }

        const newEdit = new Edit({
            title,
            author,
            video,
            source,
            tags,
            rating,
        });

        const savedEdit = await newEdit.save();

        res.status(201).json(savedEdit);
    } catch (err) {
        console.error('Ошибка при добавлении эдита:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const edit = await Edit.findById(req.params.id);
        if (!edit) {
            return res.status(404).json({ message: 'Эдит не найден' });
        }
        res.json(edit);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

export default router;

import express from 'express';
import Edit from '../models/Edit.js';
import authMiddleware from '../middleware/authMiddleware.js';
import multer from 'multer';
import streamifier from 'streamifier';
import cloudinary from '../cloudinary.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

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
        const edits = await Edit.aggregate([{ $sample: { size: 16 } }]);
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
    const limit = parseInt(req.query.limit) || 8;

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

router.post(
    '/',
    authMiddleware,
    upload.single('videoFile'), // multer для загрузки файла
    async (req, res) => {
        try {
            const { title, source, rating, video } = req.body;

            // Парсим теги
            let tags = [];
            if (req.body.tags) {
                if (typeof req.body.tags === 'string') {
                    try {
                        tags = JSON.parse(req.body.tags);
                    } catch (parseErr) {
                        console.error('Ошибка парсинга tags:', parseErr);
                        return res
                            .status(400)
                            .json({ message: 'Некорректный формат тегов' });
                    }
                } else if (Array.isArray(req.body.tags)) {
                    tags = req.body.tags;
                } else {
                    return res
                        .status(400)
                        .json({ message: 'Некорректный тип тегов' });
                }
            }

            // Проверяем обязательные поля
            if (!title || !source || rating === undefined) {
                console.warn('Отсутствуют обязательные поля');
                return res
                    .status(400)
                    .json({ message: 'Заполните все обязательные поля' });
            }

            if (!['youtube', 'cloudinary'].includes(source)) {
                console.warn('Некорректный источник видео (source):', source);
                return res
                    .status(400)
                    .json({ message: 'Некорректный источник видео (source)' });
            }

            const parsedRating = Number(rating);
            if (isNaN(parsedRating) || parsedRating < 0 || parsedRating > 11) {
                console.warn('Некорректный рейтинг:', rating);
                return res
                    .status(400)
                    .json({ message: 'Рейтинг должен быть от 0 до 11' });
            }

            // Функция для загрузки видео на Cloudinary из буфера
            const uploadFromBuffer = (fileBuffer) => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { resource_type: 'video', folder: 'edit_storage' },
                        (error, result) => {
                            if (error) {
                                console.error(
                                    'Ошибка загрузки на Cloudinary:',
                                    error
                                );
                                return reject(error);
                            }
                            resolve(result);
                        }
                    );
                    streamifier.createReadStream(fileBuffer).pipe(stream);
                });
            };

            let videoPath = '';

            if (source === 'cloudinary') {
                if (!req.file) {
                    return res
                        .status(400)
                        .json({ message: 'Файл не загружен' });
                }
                const result = await uploadFromBuffer(req.file.buffer);
                videoPath = `v${result.version}/${result.public_id}`;
            } else if (source === 'youtube') {
                if (!video) {
                    return res
                        .status(400)
                        .json({ message: 'Не указан YouTube ID видео' });
                }
                videoPath = video;
            }

            const newEdit = new Edit({
                title,
                video: videoPath,
                source,
                tags,
                rating: parsedRating,
                userId: req.user._id,
                author: req.user.nickname,
            });

            const savedEdit = await newEdit.save();

            res.status(201).json(savedEdit);
        } catch (err) {
            console.error('Ошибка при добавлении эдита:', err);
            res.status(500).json({ message: 'Ошибка сервера' });
        }
    }
);

router.get('/my', authMiddleware, async (req, res) => {
    try {
        const edits = await Edit.find({ userId: req.user._id });
        res.json(edits);
    } catch (err) {
        console.error('Ошибка при загрузке эдитов:', err);
        res.status(500).json({ error: 'Ошибка загрузки авторских эдитов' });
    }
});

router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const edit = await Edit.findById(req.params.id);
        if (!edit) {
            return res.status(404).json({ message: 'Эдит не найден' });
        }

        // Проверка авторства
        if (edit.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Нет доступа' });
        }

        const { title, tags, video, source, description, rating } = req.body;

        // Обновляем только те поля, которые пришли
        if (title !== undefined) edit.title = title;
        if (tags !== undefined) edit.tags = tags;
        if (video !== undefined) edit.video = video;
        if (source !== undefined) edit.source = source;
        if (description !== undefined) edit.description = description;
        if (rating !== undefined) {
            if (typeof rating !== 'number' || rating < 0 || rating > 11) {
                return res
                    .status(400)
                    .json({ message: 'Рейтинг должен быть от 0 до 11' });
            }
            edit.rating = rating;
        }

        const updatedEdit = await edit.save();
        res.json(updatedEdit);
    } catch (error) {
        console.error('Ошибка при редактировании эдита:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const edit = await Edit.findById(req.params.id);
        if (!edit) {
            return res.status(404).json({ message: 'Эдит не найден' });
        }

        if (edit.userId.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ message: 'У вас нет прав на удаление этого эдита' });
        }

        if (edit.source === 'cloudinary' && edit.video) {
            try {
                const publicId = edit.video.split('/').slice(1).join('/');
                await cloudinary.uploader.destroy(`edit_storage/${publicId}`, {
                    resource_type: 'video',
                });
            } catch (cloudErr) {
                console.error(
                    'Ошибка при удалении видео с Cloudinary:',
                    cloudErr
                );
            }
        }

        await Edit.findByIdAndDelete(req.params.id);
        res.json({ message: 'Эдит и видео успешно удалены' });
    } catch (error) {
        console.error('Ошибка при удалении эдита:', error);
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

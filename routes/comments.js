import express from 'express';
import Comment from '../models/Comment.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:editId', async (req, res) => {
    try {
        const comments = await Comment.find({ edit: req.params.editId })
            .populate('author', 'nickname')
            .sort({ createdAt: -1 });

        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении комментариев' });
    }
});

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { editId, text } = req.body;

        if (!editId || !text) {
            console.warn('Missing editId or text in request body');
            return res
                .status(400)
                .json({ message: 'editId и text обязательны' });
        }

        const newComment = new Comment({
            edit: editId,
            author: req.user._id,
            text,
        });

        const saved = await newComment.save();
        const populated = await saved.populate('author', 'nickname');

        res.status(201).json(populated);
    } catch (error) {
        console.error('Error in POST /comments:', error);
        res.status(500).json({
            error: error.message || 'Ошибка при добавлении комментария',
        });
    }
});

router.put('/:commentId', authMiddleware, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Комментарий не найден' });
        }

        if (comment.author.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ message: 'Нет прав на редактирование' });
        }

        comment.text = req.body.text || comment.text;
        await comment.save();

        const populated = await comment.populate('author', 'nickname');
        res.json(populated);
    } catch (err) {
        res.status(500).json({
            message: 'Ошибка при редактировании комментария',
        });
    }
});

router.delete('/:commentId', authMiddleware, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Комментарий не найден' });
        }

        if (comment.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Нет прав на удаление' });
        }

        await comment.deleteOne();
        res.json({ message: 'Комментарий удалён' });
    } catch (err) {
        res.status(500).json({ message: 'Ошибка при удалении комментария' });
    }
});

export default router;

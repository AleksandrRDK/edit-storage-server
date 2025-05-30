import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Edit from '../models/Edit.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/:editId', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { editId } = req.params;

        const user = await User.findById(userId);
        if (!user)
            return res.status(404).json({ message: 'Пользователь не найден' });

        if (!user.favorites.includes(editId)) {
            user.favorites.push(editId);
            await user.save();
        }

        res.json({
            message: 'Добавлено в избранное',
            favorites: user.favorites,
        });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.delete('/:editId', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { editId } = req.params;

        const user = await User.findById(userId);
        if (!user)
            return res.status(404).json({ message: 'Пользователь не найден' });

        user.favorites = user.favorites.filter(
            (id) => id.toString() !== editId
        );
        await user.save();

        res.json({
            message: 'Удалено из избранного',
            favorites: user.favorites,
        });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const totalFavorites = user.favorites.length;

        // Проверяем, что все айди валидные
        const pagedFavoritesIds = user.favorites
            .slice(skip, skip + limit)
            .filter((id) => mongoose.Types.ObjectId.isValid(id));

        if (pagedFavoritesIds.length === 0) {
            return res.json({
                total: totalFavorites,
                page,
                limit,
                edits: [],
            });
        }

        const edits = await Edit.find({ _id: { $in: pagedFavoritesIds } });

        res.json({
            total: totalFavorites,
            page,
            limit,
            edits,
        });
    } catch (error) {
        console.error('Ошибка в GET /favorites:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.get('/check/:editId', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { editId } = req.params;

        const user = await User.findById(userId).select('favorites');
        if (!user)
            return res.status(404).json({ message: 'Пользователь не найден' });

        const isFavorite = user.favorites.some(
            (favId) => favId.toString() === editId
        );
        res.json({ isFavorite });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

export default router;

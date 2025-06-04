import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', async (req, res) => {
    const {
        email,
        password,
        nickname,
        role = 'user',
        adminSecret = '',
    } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser)
            return res.status(400).json({ message: 'Почта уже используется' });

        if (role === 'admin') {
            if (adminSecret !== process.env.ADMIN_SECRET) {
                return res
                    .status(403)
                    .json({ message: 'Неверный секретный пароль для админа' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            email,
            password: hashedPassword,
            nickname,
            role,
        });

        await newUser.save();

        res.status(201).json({ message: 'Пользователь создан' });
    } catch (err) {
        console.error('Error in /register:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user)
            return res
                .status(400)
                .json({ message: 'Неверная почта или пароль' });

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid)
            return res
                .status(400)
                .json({ message: 'Неверная почта или пароль' });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });

        res.json({
            token,
            user: {
                email: user.email,
                nickname: user.nickname,
                favorites: user.favorites,
                createdAt: user.createdAt,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.post('/change-password', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;
        const { oldPassword, newPassword } = req.body;

        const user = await User.findById(userId);
        if (!user)
            return res.status(404).json({ message: 'Пользователь не найден' });

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch)
            return res.status(400).json({ message: 'Неверный старый пароль' });

        const hashed = await bcrypt.hash(newPassword, 10);
        user.password = hashed;
        await user.save();

        res.json({ message: 'Пароль успешно изменён' });
    } catch (err) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user)
            return res.status(404).json({ message: 'Пользователь не найден' });

        res.json({ user });
    } catch (err) {
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

export default router;

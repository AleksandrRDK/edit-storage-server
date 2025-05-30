import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import editRoutes from './routes/editRoutes.js';
import authRoutes from './routes/auth.js';
import favoritesRoutes from './routes/favoritesRoutes.js';
import getEditOfTheDay from './routes/editOfTheDay.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 🛠️ Настроенный CORS
app.use(
    cors({
        origin: 'https://aleksandrrdk.github.io',
        credentials: true,
    })
);

// 🛡️ Временное решение: ручные заголовки (на всякий случай)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://aleksandrrdk.github.io');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept'
    );
    res.header(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS'
    );
    next();
});

app.use(express.json());

// Подключение к MongoDB
console.log('MONGO_URI:', process.env.MONGO_URI);

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Успешное подключение к MongoDB Atlas');
        app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
    })
    .catch((err) => {
        console.error('Ошибка подключения к MongoDB:', err);
    });

// Роуты
app.get('/', (req, res) => {
    res.send('Сервер работает!');
});

app.use('/api/edits', editRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users/favorites', favoritesRoutes);
app.use('/api/edit-of-the-day', getEditOfTheDay);

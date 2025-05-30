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

app.use(cors());
app.use(express.json());

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Успешное подключение к MongoDB Atlas');
        app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
    })
    .catch((err) => {
        console.error('Ошибка подключения к MongoDB:', err);
    });

app.get('/', (req, res) => {
    res.send('Сервер работает!');
});

app.use('/api/edits', editRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users/favorites', favoritesRoutes);
app.use('/api/edit-of-the-day', getEditOfTheDay);

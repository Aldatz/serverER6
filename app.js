// app.js
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

import playerRoutes from './routes/playerRoutes.js';
import authRoutes from './routes/authRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import ingredientRoutes from './routes/ingredientRoutes.js';
import potionRoutes from './routes/potionRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/api/players', playerRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/ingredients', ingredientRoutes);
app.use('/potions', potionRoutes);



export default app;
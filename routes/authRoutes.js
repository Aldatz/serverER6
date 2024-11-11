// routes/authRoutes.js
import express from 'express';
import { verifyToken } from '../controllers/authController.js';

const router = express.Router();

router.post('/verify-token', verifyToken);

export default router;
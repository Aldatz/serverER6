// routes/authRoutes.js
import express from 'express';
import { verifyToken,refreshToken, generateToken } from '../controllers/authController.js';

const router = express.Router();

router.post('/verify-token', verifyToken);
router.post('/refresh-token', refreshToken);
router.post('/get-token', generateToken);
export default router;
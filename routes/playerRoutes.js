// routes/playerRoutes.js
import express from 'express';
import {
  isInsideTower,
  isInside,
  patchPlayer,
  getMortimerPlayers,
} from '../controllers/playerController.js';

const router = express.Router();

router.post('/isInsideTower', isInsideTower);
router.post('/isInside', isInside);
router.post('/patchPlayer', patchPlayer);
router.get('/mortimer', getMortimerPlayers);

export default router;
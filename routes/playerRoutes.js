// routes/playerRoutes.js
import express from 'express';
import {
  isInsideTower,
  isInside,
  patchPlayer,
  getMortimerPlayers,
  giveIngredients,
  update,
} from '../controllers/playerController.js';
import { giveAllIngredients } from '../services/playerService.js';

const router = express.Router();

router.post('/isInsideTower', isInsideTower);
router.post('/isInside', isInside);
router.post('/patchPlayer', patchPlayer);
router.get('/mortimer', getMortimerPlayers);
router.get('/giveIngredients/:email', giveIngredients);
router.put('/update', update);


export default router;
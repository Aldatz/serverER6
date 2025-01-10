// routes/playerRoutes.js
import express from 'express';
import {
  isInsideTower,
  isInside,
  patchPlayer,
  getMortimerPlayers,
  giveIngredients,
  update,
  applyCurse,
} from '../controllers/playerController.js';

const router = express.Router();

router.post('/isInsideTower', isInsideTower);
router.post('/isInside', isInside);
router.post('/patchPlayer', patchPlayer);
router.get('/mortimer', getMortimerPlayers);
router.get('/giveIngredients/:email', giveIngredients);
router.put('/update', update);
router.post('/applyCurse/:email', applyCurse);


export default router;
// routes/playerRoutes.js
import express from 'express';
import {
  isInsideTower,
  isInside,
  patchPlayer,
  getMortimerPlayers,
} from '../controllers/playerController.js';
import { giveAllIngredients } from '../services/playerService.js';

const router = express.Router();

router.post('/isInsideTower', isInsideTower);
router.post('/isInside', isInside);
router.post('/patchPlayer', patchPlayer);
router.get('/mortimer', getMortimerPlayers);
router.get('/giveIngredients/:email', async (req, res) => {
  try {
    const email = req.params.email; // Extract email from the route
    await giveAllIngredients(email);
    res.status(200).send({ message: 'Ingredients updated successfully!' });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});


export default router;
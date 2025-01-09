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
app.put('/update', async (req, res) => {
  try {
      const { email, playerData } = req.body;
      const updatedPlayer = await Player.findOneAndUpdate(
          { email },
          { playerData },
          { new: true }
      );
      if (!updatedPlayer) {
          return res.status(404).json({ success: false, message: 'Player not found' });
      }
      res.json({ success: true, player: updatedPlayer });
  } catch (error) {
      console.error('Error updating player:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
  }
});


export default router;
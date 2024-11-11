// controllers/playerController.js
import {
    mortimerGet,
    getUserIsInsideTower,
    getUserIsInside,
    updatePlayerByEmail,
  } from '../services/playerService.js';
  
  export const isInsideTower = async (req, res) => {
    try {
      const { email } = req.body;
      console.log(email);
  
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
  
      const isInsideTower = await getUserIsInsideTower(email);
      res.json(isInsideTower);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error fetching data' });
    }
  };
  
  export const isInside = async (req, res) => {
    try {
      const { email } = req.body;
      console.log(email);
  
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
  
      const isInside = await getUserIsInside(email);
      res.json(isInside);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error fetching data' });
    }
  };
  
  export const patchPlayer = async (req, res) => {
    try {
      const { player } = req.body;
      console.log(player);
  
      if (!player) {
        return res.status(400).json({ error: 'Player is required' });
      }
  
      await updatePlayerByEmail(player.email, player);
      res.json({ success: 'Player Updated' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error updating player' });
    }
  };
  
  export const getMortimerPlayers = async (req, res) => {
    try {
      const players = await mortimerGet();
      res.json(players);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching players' });
    }
  };
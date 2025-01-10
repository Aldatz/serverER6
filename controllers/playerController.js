// controllers/playerController.js
import {
    mortimerGet,
    getUserIsInsideTower,
    getUserIsInside,
    updatePlayerByEmail,
    applyCurseToPlayer
  } from '../services/playerService.js';

import { Player } from '../Schemas/PlayerSchema.js';
  export const update = async (req, res) => {
    try {
        const { email, ...updateFields } = req.body;
        const updatedPlayer = await Player.findOneAndUpdate(
            { email },
            { ...updateFields },
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
  }

  export const applyCurse = async (req, res) => {
    try {
      const { email } = req.params;
      const { curse } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      console.log('applying curse',email,' to player ', email);

      const response = await applyCurseToPlayer(email,curse);
      res.json(response);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error fetching data' });
    }
  };

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
  export const giveIngredients = async (req, res) => {
    try {
      const email = req.params.email; // Extract email from the route
      await giveAllIngredients(email);
      res.status(200).send({ message: 'Ingredients updated successfully!' });
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  }
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
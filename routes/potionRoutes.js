// routes/potionRoutes.js
import express from 'express';
import axios from 'axios';

const router = express.Router();

// Ruta para obtener pociones
router.get('/', async (req, res) => {
  try {
    const url = `https://kaotika-server.fly.dev/diseases`;
    const response = await axios.get(url);
    
    if (response.data && response.data.data) {
      res.json({
        success: true,
        potionsData: response.data.data,
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No potions found',
      });
    }
  } catch (error) {
    console.error('Error fetching potions:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch potions',
      error: error.message 
    });
  }
});

export default router;
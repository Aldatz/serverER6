import express from 'express';
import fetch from 'node-fetch';
import '../utils/interceptor';

const router = express.Router();

// Ruta para obtener pociones
router.get('/', async (req, res) => {
  try {
    const url = `https://kaotika-server.fly.dev/diseases`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    
    if (data && data.data) {
      res.json({
        success: true,
        potionsData: data.data,
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
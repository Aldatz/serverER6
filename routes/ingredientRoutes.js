import express from 'express';
import fetch from 'node-fetch';
import '../utils/interceptor.js';

const router = express.Router();

// Ruta para obtener ingredientes
router.get('/', async (req, res) => {
  try {
    const url = `https://kaotika-server.fly.dev/ingredients`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    
    if (data && data.data) {
      res.json({
        success: true,
        ingredientsData: data.data,
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No ingredients found',
      });
    }
  } catch (error) {
    console.error('Error fetching ingredients:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ingredients',
      error: error.message 
    });
  }
});

export default router;
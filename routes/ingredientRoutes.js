// routes/ingredientRoutes.js
import express from 'express';
import axios from 'axios';

const router = express.Router();

// Ruta para obtener ingredientes
router.get('/', async (req, res) => {
  try {
    const url = `https://kaotika-server.fly.dev/ingredients`;
    const response = await axios.get(url);
    
    if (response.data && response.data.data) {
      res.json({
        success: true,
        ingredientsData: response.data.data,
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
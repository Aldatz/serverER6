const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { initializeApp, cert } = require('firebase-admin/app'); // Cambia applicationDefault() por cert si usas credenciales de servicio
const { getAuth } = require('firebase-admin/auth');
require('dotenv').config();


const firebaseCredentials = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };

// Inicializa Firebase Admin usando las credenciales del archivo .env
initializeApp({
    credential: cert(firebaseCredentials),
    databaseURL: process.env.FIREBASE_DATABASE_URL, // Ajusta según sea necesario
  });

const app = express();
const PORT = 3000;

app.use(cors());

// Middleware para autenticar tokens Firebase
app.use(async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken; // Guarda el usuario autenticado en la solicitud
    next();
  } catch (error) {
    console.error(`Token verification error: ${error.message}`);
    return res.status(403).json({ error: 'Invalid token' });
  }
});

// Ruta protegida que solo permite accesos autenticados
app.get('/players/email/:email', async (req, res) => {
  const email = req.params.email;
  const url = `https://kaotika-server.fly.dev/players/email/${email}`;
  
  try {
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error(`Error getting player data: ${error.message}`);
    res.status(500).json({ error: 'Error getting player data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

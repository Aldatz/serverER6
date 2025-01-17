// controllers/authController.js
import axios from 'axios';
import admin from '../config/firebaseConfig.js';
import { insertPlayer } from '../services/authService.js';
import { Player } from '../Schemas/PlayerSchema.js';
import jwt from 'jsonwebtoken';

export const verifyToken = async (req, res) => {
  const { idToken, email, socketId, fcmToken } = req.body;
  console.log('Email recibido:', email);
  console.log('Socket ID recibido:', socketId);
  console.log('FCM Token recibido:', fcmToken);

  if (!idToken) {
    return res.status(400).json({ error: 'No se proporcionó el idToken' });
  }
  if (!fcmToken) {
    return res.status(400).json({ error: 'No se proporcionó el fcmToken' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    console.log('Token verificado. UID del usuario:', uid);

    const url = `https://kaotika-server.fly.dev/players/email/${email}`;
    const response = await axios.get(url);
    const playerData = await insertPlayer(response.data);

    const player = await Player.findOne({ email });
    if (player) {
      player.socketId = socketId;
      player.fcmToken = fcmToken;
      await player.save();
      console.log(`Socket ID ${socketId} asignado al jugador con email: ${email}`);
      console.log(`FCM Token: ${fcmToken} asignado al jugador con email: ${email}`);
    }

    res.json({
      success: true,
      uid: uid,
      decodedToken,
      playerData,
    });
  } catch (error) {
    console.error('Error al verificar el token o al obtener datos del jugador:', error);
    res.status(500).json({
      error: 'Token inválido, expirado o error al obtener datos del jugador',
    });
  }
};

export const refreshToken = async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Obtener el token del header

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Verificar el token expirado, sin rechazarlo
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });

    // Generar un nuevo token
    const newToken = jwt.sign(
      { sub: decoded.sub, name: decoded.name, role: decoded.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );

    return res.json({ token: newToken });
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const generateToken = (req, res) => {
  const { id, email} = req.body;
  console.log('generateToken');

  if (!id || !email) {
    return res.status(400).json({ error: 'Missing user data' });
  }

  // Crear un token con los datos del usuario
  const token = jwt.sign(
    { sub: id ,email},
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  return res.json({ token });
};
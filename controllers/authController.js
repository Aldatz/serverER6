// controllers/authController.js
import admin from '../config/firebaseConfig.js';
import { insertPlayer } from '../services/authService.js';
import { Player } from '../Schemas/PlayerSchema.js';
import '../utils/interceptor.js'

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
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    const playerData = await insertPlayer(data);

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
    console.error('Error verifying token:', error);
    res.status(500).json({ error: 'Error verifying token' });
  }
};
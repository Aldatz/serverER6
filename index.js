const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { initializeApp, cert } = require('firebase-admin/app'); // Cambia applicationDefault() por cert si usas credenciales de servicio
const { getAuth } = require('firebase-admin/auth');
require('dotenv').config();
const bodyParser = require('body-parser');
// import firebase-admin package
const admin = require('firebase-admin');
const { start } = require('repl');



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


mongoose.connection.on('connected', () => console.log('connected'));
mongoose.connection.on('open', () => console.log('open'));
mongoose.connection.on('disconnected', () => console.log('disconnected'));
mongoose.connection.on('reconnected', () => console.log('reconnected'));
mongoose.connection.on('disconnecting', () => console.log('disconnecting'));
mongoose.connection.on('close', () => console.log('close'));

main().catch(err => console.log(err));

async function main() {

  try {
    await mongoose.connect(process.env.CONNECTION_STRING);
  } catch (error) {
    console.log(error);
  }
}

// Middleware
app.use(cors()); 
app.use(bodyParser.json()); 

app.post('/verify-token', async (req, res) => {
  const { idToken, email } = req.body;
  console.log("Token recibido:", idToken);
  console.log("Email recibido:", email);

  if (!idToken) {
    return res.status(400).json({ error: 'No se proporcionó el idToken' });
  }

  try {
    // Verificar el idToken con Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    console.log('Token verificado. UID del usuario:', uid);

    // Ahora haces la petición a la API de Kaotika
    const url = `https://kaotika-server.fly.dev/players/email/${email}`;
    const response = await axios.get(url);

    // Combina ambas respuestas en una sola
    res.json({
      success: true,
      uid: uid,
      decodedToken,
      playerData: response.data
    });

        insertPlayer(response.data)

  } catch (error) {
    console.error('Error al verificar el token o al obtener datos del jugador:', error);
    res.status(500).json({ error: 'Token inválido, expirado o error al obtener datos del jugador' });
  }
});
  

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

async function insertPlayer(playerData) {
  try {
    const data = playerData.data
    // check players email in collections
    const existingPlayer = await Player.findOne({ email: data.email });
    console.log(data.email);
    console.log(existingPlayer);
    
    if (existingPlayer) {
      // player in collection, update  data
      await Player.updateOne({ email: data.email }, data);
      console.log(`Player with email ${data.email} updated successfully.`);
    } else {
      //player is not in collections, add the role and create a new player
      switch (data.email) {
        case process.env.ISTVAN_EMAIL: //istvan
            data.role = 'ISTVAN';             
            break;
        case process.env.VILLAIN_EMAIL: //villano
            data.role = 'VILLAIN';             
            break;
        case process.env.MORTIMER_EMAIL: //mortimer
            data.role = 'MORTIMER';             
            break;
        default:
            data.role = 'ACOLYTE'; //acolyte, for the moment no ikasle.aeg.eus confirmation             
            break;
      }
      const newPlayer = new Player(data);
      await newPlayer.save();
      console.log(`Player with email ${data.email} created successfully.`);
    }
  } catch (error) {
    console.error('Error updating/creating player:', error);
  }
}

start();



 
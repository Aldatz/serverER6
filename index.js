import express from 'express';
import axios from 'axios';
import cors from 'cors';
import { initializeApp, cert } from 'firebase-admin/app'; // Cambia applicationDefault() por cert si usas credenciales de servicio
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import admin from 'firebase-admin';
import { start } from 'repl';
import mongoose from 'mongoose';
import { Player } from './Schemas/PlayerSchema.js';
import { Server } from 'socket.io'; // Importa socket.io
import http from 'http'; // Necesario para crear el servidor HTTP
import { error } from 'console';

// Carga las variables de entorno desde el archivo .env
dotenv.config();

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

// Crear servidor HTTP y enlazar con Express
const server = http.createServer(app);

// Inicializar socket.io con el servidor HTTP
const io = new Server(server, {
    cors: {
        origin: '*', // Permitir acceso desde cualquier origen, cambiar según sea necesario
        methods: ['GET', 'POST']
    }
});

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


// Socket.io eventos
io.on('connection', async (socket) => {
  console.log(`Un jugador se ha conectado: ${socket.id}`);
  //conexion correcta emitir alert
  socket.emit('response', { message: 'Bienvenido al servidor!' });
  // Escucha de un evento personalizado (ejemplo de evento para cambiar el estado de un Acolyte)
  socket.on('scan_acolyte', async (data) => {
      const { scannedEmail } = data;
      try {
          const acolyte = await Player.findOne({ email: scannedEmail });

          if (!acolyte) {
              return socket.emit('error', { message: 'Acolyte no encontrado' });
          }
          // Cambiar el estado del Acolyte
          acolyte.is_active = !acolyte.is_active;
          await acolyte.save();

          // Enviar el estado actualizado al cliente
          socket.emit('acolyte_status_updated', {
              success: true,
              email: acolyte.email,
              is_active: acolyte.is_active,
              message: `Acolyte ahora está ${acolyte.is_active ? 'online' : 'offline'}`
          });

          // Alerta al Acolyte que fue escaneado
          console.log(socket.id);
          
          socket.emit('alert', {
            message: `Tu estado ha cambiado a ${acolyte.is_active ? 'online' : 'offline'}`,
        });

        // Alerta a ISTVAN
        socket.emit('alert_itsvan', {
            message: `El Acolyte ${acolyte.email} ha sido ${acolyte.is_active ? 'conectado' : 'desconectado'}.`,
        });

          console.log(`Estado del Acolyte actualizado: ${acolyte.email} - ${acolyte.is_active ? 'online' : 'offline'}`);
      } catch (error) {
          console.error('Error al cambiar el estado del Acolyte:', error);
          socket.emit('error', { message: 'Error al cambiar el estado del Acolyte' });
      }
  });

  // Desconexión
  socket.on('disconnect', () => {
      console.log(`Jugador desconectado: ${socket.id}`);
  });
});

//ruta para verificar token
app.post('/verify-token', async (req, res) => {
  const { idToken, email } = req.body;
  //console.log("Token recibido:", idToken);
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
    const data = await insertPlayer(response.data)

    try{
      const acolyte = await Player.findOne({ email: scannedEmail });
      acolyte.socketId = socket.id;
    }catch{
      console.log("Error asignin sockect to user");
    }
    
    // Combina ambas respuestas en una sola
    res.json({
      success: true,
      uid: uid,
      decodedToken,
      playerData: data
    });



  } catch (error) {
    console.error('Error al verificar el token o al obtener datos del jugador:', error);
    res.status(500).json({ error: 'Token inválido, expirado o error al obtener datos del jugador' });
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

async function insertPlayer(playerData) {
  try {
    const data = playerData.data;
    // check players email in collections
    const existingPlayer = await Player.findOne({ email: data.email });
    if (existingPlayer) {
      // player in collection, update  data
      await Player.updateOne({ email: data.email }, data);
      console.log(`Player with email ${data.email} updated successfully.`);
      return existingPlayer;
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
      return newPlayer;
    }
  } catch (error) {
    console.error('Error updating/creating player:', error);
  }

}

start();

import express from 'express';
import axios from 'axios';
import cors from 'cors';
import { initializeApp, cert } from 'firebase-admin/app'; 
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import admin from 'firebase-admin';
import mongoose from 'mongoose';
import { Player } from './Schemas/PlayerSchema.js';
import { Server } from 'socket.io';
import http from 'http';
import { start } from 'repl';

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
    databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const app = express();
const PORT = 3000;

// Crear servidor HTTP y enlazar con Express
const server = http.createServer(app);

// Inicializar socket.io con el servidor HTTP
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Conectar a MongoDB
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

// Nueva función llamada "mortimerGet" para obtener todos los jugadores, excluyendo ciertos roles
const mortimerGet = async () => {
  try {
    const excludedEmails = [
      process.env.ISTVAN_EMAIL,
      process.env.VILLAIN_EMAIL,
      process.env.MORTIMER_EMAIL
    ];

    // Buscar usuarios excluyendo los correos especificados y seleccionando solo los campos deseados
    const players = await Player.find(
      { email: { $nin: excludedEmails } }, // Excluye los correos
      { is_active: 1, name: 1, nickname: 1 , avatar: 1 } // Solo selecciona estos campos
    );

    return players;
  } catch (error) {
    console.error('Error fetching players:', error);
    throw error;
  }
};

// Socket.io eventos
io.on('connection', async (socket) => {
  console.log(`Un jugador se ha conectado: ${socket.id}`);

  // Enviar la lista de jugadores (excluyendo los especificados) al cliente que se acaba de conectar
  try {
    const players = await mortimerGet();
    socket.emit('all_players', players);  // Enviar lista de jugadores excluyendo los mencionados
  } catch (error) {
    socket.emit('error', { message: 'Error al obtener la lista de jugadores.' });
  }

  // Escucha de un evento personalizado (ejemplo de evento para cambiar el estado de un Acolyte)
  socket.on('scan_acolyte', async (data) => {
    const { scannedEmail } = data;
    try {
      const acolyte = await Player.findOne({ email: scannedEmail });
      const acolyte_socket = acolyte.socketId;

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
        message: `Acolyte ahora está ${acolyte.is_active ? 'online' : 'offline'}`,
      });

      // Alerta al Acolyte que fue escaneado
      socket.to(acolyte_socket).emit('alert', {
        message: `Tu estado ha cambiado a ${acolyte.is_active ? 'online' : 'offline'}`,
        from: socket.id,
      });

      // Emitir alerta a ISTVAN
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

// Nueva ruta API para obtener todos los jugadores, excluyendo los especificados
app.get('/mortimer', async (req, res) => {
  try {
    const players = await mortimerGet();
    res.json(players); // Envía los jugadores como respuesta JSON
  } catch (error) {
    res.status(500).json({ error: 'Error fetching players' });
  }
});

// Ruta para verificar token
app.post('/verify-token', async (req, res) => {
  const { idToken, email, socketId } = req.body; // Asegúrate de que se envíe el socketId desde el cliente
  console.log("Email recibido:", email);
  console.log("Socket ID recibido:", socketId);

  if (!idToken) {
    return res.status(400).json({ error: 'No se proporcionó el idToken' });
  }

  try {
    // Verifica el token de Firebase
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    console.log('Token verificado. UID del usuario:', uid);

    // Obtener los datos del jugador desde la API
    const url = `https://kaotika-server.fly.dev/players/email/${email}`;
    const response = await axios.get(url);
    const playerData = await insertPlayer(response.data);

    // Asignar socketId al jugador en la base de datos
    const player = await Player.findOne({ email });
    if (player) {
      player.socketId = socketId; // Asignamos el socketId recibido
      await player.save();        // Guardamos los cambios en la base de datos
      console.log(`Socket ID ${socketId} asignado al jugador con email: ${email}`);
    }

    // Responder con los datos
    res.json({
      success: true,
      uid: uid,
      decodedToken,
      playerData
    });

  } catch (error) {
    console.error('Error al verificar el token o al obtener datos del jugador:', error);
    res.status(500).json({ error: 'Token inválido, expirado o error al obtener datos del jugador' });
  }
});


// Iniciar el servidor
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Función para insertar jugador en la base de datos
async function insertPlayer(playerData) {
  try {
    const data = playerData.data;
    const existingPlayer = await Player.findOne({ email: data.email });
    if (existingPlayer) {
      await Player.updateOne({ email: data.email }, data);
      console.log(`Player with email ${data.email} updated successfully.`);
      return existingPlayer;
    } else {
      switch (data.email) {
        case process.env.ISTVAN_EMAIL:
          data.role = 'ISTVAN';
          break;
        case process.env.VILLAIN_EMAIL:
          data.role = 'VILLAIN';
          break;
        case process.env.MORTIMER_EMAIL:
          data.role = 'MORTIMER';
          break;
        default:
          data.role = 'ACOLYTE';
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

// Mantener el uso de start()
start();

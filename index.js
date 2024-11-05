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
import mqtt from 'mqtt';
import serviceAccount from './eias-ab66d-e48e16bc8cba.json' with {type: "json"};

// Carga las variables de entorno desde el archivo .env
dotenv.config();
 
const firebaseCredentials = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

// Inicializa Firebase Admin usando las credenciales del archivo .env
initializeApp({
  credential: admin.credential.cert(serviceAccount),
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

const mqttClient = mqtt.connect(`mqtt://${process.env.MQTT_SERVER}`, {
  port: process.env.MQTT_PORT || 1883,
  clientId: 'SERVER_EIAS',
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
      { is_active: 1, name: 1, nickname: 1 , avatar: 1, is_inside_tower: 1, } // Solo selecciona estos campos
    );

    return players;
  } catch (error) {
    console.error('Error fetching players:', error);
    throw error;
  }
};

app.post('/isInsideTower', async (req, res) => {
  try {
    const { email } = req.body;
    console.log(email); // Check if the email is coming correctly
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const isInsideTower = await getUserIsInsideTower(email);
    res.json(isInsideTower); // Send the 'is_active' status as JSON
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error fetching players' });
  }
});

app.post('/isInside', async (req, res) => {
  try {
    const { email } = req.body;
    console.log(email); // Check if the email is coming correctly
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const isInside = await getUserIsInside(email);
    res.json(isInside); // Send the 'is_active' status as JSON
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error fetching players' });
  }
});

app.post('/patchPlayer', async (req, res) => {
  try {
    const { player } = req.body;
    console.log(player); // Check if the player is coming correctly
    await updatePlayerByEmail(player.email, player)
    if (!player) {
      return res.status(400).json({ error: 'Player is required' });
    }

    res.json({success: 'Player Updated'});
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error fetching players' });
  }
});

async function updatePlayerByEmail(email, updateData) {
  try {
    const updatedPlayer = await Player.findOneAndUpdate(
      { email },                  // Filter based on email
      { $set: updateData },       // Set only the fields provided in updateData
      { new: true, runValidators: true } // Options to return the updated doc and validate data
    );

    if (!updatedPlayer) {
      console.log('Player not found');
      return null;
    }

    console.log('Player updated successfully:', updatedPlayer);
    return updatedPlayer;
  } catch (error) {
    console.error('Error updating player:', error);
    throw error;
  }
}

const getUserIsInsideTower = async (email) => {
  try {
    // Find the user by email and select the 'is_inside_tower' field
    const isInsideTower = await Player.findOne({ email: email }).select('is_inside_tower');
    if (isInsideTower) {
      console.log(isInsideTower.is_inside_tower); // Log the 'is_inside_tower' status
    } else {
      console.log('User not found');
    }
    return isInsideTower;
  } catch (error) {
    console.error('Error fetching IsInside:', error);
    throw error;
  }
};

const getUserIsInside = async (email) => {
  try {
    // Find the user by email and select the 'is_active' field
    const isInside = await Player.findOne({ email: email }).select('is_active');
    if (isInside) {
      console.log(isInside.is_active); // Log the 'is_active' status
    } else {
      console.log('User not found');
    }
    return isInside;
  } catch (error) {
    console.error('Error fetching IsInside:', error);
    throw error;
  }
};

// Socket.io eventos
io.on('connection', async (socket) => {
  console.log(`Un jugador se ha conectado: ${socket.id}`);

  // Enviar la lista de jugadores (excluyendo los especificados) al cliente que se acaba de conectar
  try {
    const players = await mortimerGet();
    socket.to(mortimer_socket).emit('all_players', {
      players: players,
      from: socket.id,
    });
  } catch (error) {
    socket.emit('error', { message: 'Error al obtener la lista de jugadores.' });
  }


  try {
    socket.emit('request_email');

    socket.on('send_email', async (data) => {
      const { email } = data;
  
      try {
        // Encuentra el usuario y actualiza el socketId
        const user = await Player.findOneAndUpdate(
          { email: email },
          { socketId: socket.id }, // Actualiza el socketId
          { new: true }
        );
  
        if (user) {
          console.log(`Socket ID actualizado para el usuario: ${email}`);
        } else {
          console.log(`Usuario con email ${email} no encontrado`);
        }
      } catch (error) {
        console.error('Error actualizando el socketId en MongoDB:', error);
      }
    });
  } catch (error) {
    socket.emit('error', { message: 'Error al obtener el correo del jugador' });
  }

  // Escucha de un evento personalizado (ejemplo de evento para cambiar el estado de un Acolyte)
  socket.on('scan_acolyte', async (data) => {
    const { scannedEmail } = data;
    try {
      const acolyte = await Player.findOne({ email: scannedEmail });
      const MORTIMER = await Player.findOne({ email: process.env.MORTIMER_EMAIL });
      const acolyte_socket = acolyte.socketId;
      const mortimer_socket = MORTIMER.socketId;

      if (!acolyte) {
        return socket.emit('error', { message: 'Acolyte no encontrado' });
      }

      // Cambiar el estado del Acolyte
      acolyte.is_active = !acolyte.is_active;
      await acolyte.save();
      const players = await mortimerGet();
      socket.to(mortimer_socket).emit('all_players', {
      players: players,
      from: socket.id,
    });


      // Enviar el estado actualizado al cliente
      socket.emit('acolyte_status_updated', {
        success: true,
        email: acolyte.email,
        is_active: acolyte.is_active,
        message: `Acolyte ahora está ${acolyte.is_active ? 'online' : 'offline'}`,
      });

      // Alerta al Acolyte que fue escaneado
      // socket.to(acolyte_socket).emit('alert', {
      //   message: `Tu estado ha cambiado a ${acolyte.is_active ? 'online' : 'offline'}`,
      //   from: socket.id,
      // });

      socket.to(acolyte_socket).emit('qr_scanned', {
        is_active: acolyte.is_active,
      });
      
        // Alerta al Acolyte que fue escaneado
        socket.to(acolyte_socket).emit('change_isInside', {
          data: acolyte.is_active,
          from: socket.id,
        });

      // Emitir alerta a ISTVAN
      // socket.emit('alert_itsvan', {
      //   message: `El Acolyte ${acolyte.email} ha sido ${acolyte.is_active ? 'conectado' : 'desconectado'}.`,
      // });

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

// Cambia app.post a app.get
app.get('/ingredients', async (req, res) => {
  try {
    const url = `https://kaotika-server.fly.dev/ingredients`;
    const response = await axios.get(url);
    
    // Verifica si la respuesta tiene datos
    if (response.data && response.data.data) {
      res.json({
        success: true,
        ingredientsData: response.data.data,  // Enviar el array de ingredientes
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

app.get('/potions', async (req, res) => {
  try {
    const url = `https://kaotika-server.fly.dev/diseases`;
    const response = await axios.get(url);
    
    // Verifica si la respuesta tiene datos
    if (response.data && response.data.data) {
      res.json({
        success: true,
        potionsData: response.data.data,  // Enviar el array de ingredientes
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

// Ruta para verificar token

// Ruta para verificar token
app.post('/verify-token', async (req, res) => {
  const { idToken, email, socketId, fcmToken } = req.body; // Asegúrate de que se envíe el socketId desde el cliente
  console.log("Email recibido:", email);
  console.log("Socket ID recibido:", socketId);
  console.log("FCM Token recibido:", fcmToken);

  if (!idToken) {
    return res.status(400).json({ error: 'No se proporcionó el idToken' });
  }
  if (!fcmToken) {
    return res.status(400).json({ error: 'No se proporcionó el fcmToken' });
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
      player.fcmToken = fcmToken;
      await player.save();        // Guardamos los cambios en la base de datos
      console.log(`Socket ID ${socketId} asignado al jugador con email: ${email}`);
      console.log(`FCM Token: ${fcmToken} asignado al jugador con email: ${email}`);

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
          // Actualiza los campos necesarios sin cambiar el estado de is_active
          await Player.updateOne({ email: data.email }, {
              ...data,
              is_active: existingPlayer.is_active, // Mantén el estado existente
              is_inside_tower: existingPlayer.is_inside_tower,
          });
          console.log(`Player with email ${data.email} updated successfully.`);
          return existingPlayer;
      } else {
          data.is_active = false; // Solo para nuevos jugadores
          data.is_inside_tower = false;
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

mqttClient.on('error', (error) => {
  console.error('Error al conectar al broker MQTT:', error);
});

mqttClient.on('reconnect', () => {
  console.log('Reintentando conectar al broker MQTT');
});

mqttClient.on('close', () => {
  console.log('Conexión al broker MQTT cerrada');
});

mqttClient.on('offline', () => {
  console.log('No esta conectado al broker MQTT');
});

// Suscribirse al tópico 'EIASidCard' cuando el cliente se conecta al broker cambiar nombre para otro tipo de mensajes
mqttClient.on('connect', () => {
  console.log('Conectado al broker MQTT');
  console.log('comentario de prueba')
  mqttClient.subscribe('EIASidCard', (err) => {
    if (err) {
      console.error('Error al suscribirse al tópico EIASidCard:', err);
    } else {
      console.log('Suscrito al tópico EIASidCard');
    }
  });
  mqttClient.subscribe('EIASdoorOpened', (err) => {
    if (err) {
      console.error('Error al suscribirse al tópico EIASdoorOpened:', err);
    } else {
      console.log('Suscrito al tópico EIASdoorOpened');
    }
  });
});

mqttClient.on('message', (topic, message) => {
  if (topic === 'EIASdoorOpened') {
    // Aquí puedes agregar cualquier lógica adicional si es necesario
    console.log('Mensaje recibido en EIASdoorOpened:', message.toString());

    // Emitir evento 'door_status' a los clientes conectados para indicar que la puerta está abierta
    io.emit('pushNotification', "");
  }
});

mqttClient.on('message', async (topic, message) => {
  const messageStr = message.toString().trim();

  if (topic === 'EIASidCard') {
    const receivedCardId = message.toString().trim();
    try {
      // Buscar en la base de datos un jugador con el cardId recibido
      const player = await Player.findOne({ cardId: receivedCardId });

      if (player) {
        console.log(`UID recibido coincide con cardId en la base de datos para el jugador: ${player.name}`);

        // Publicar un mensaje en otro tópico, por ejemplo, 'EIAS/confirm'
        mqttClient.publish('EIASOpenDoor', `${player.name}`);
      } else {
        console.log(`UID recibido no coincide con ningún cardId en la base de datos: ${receivedCardId}`);

        mqttClient.publish('EIASOpenDoorDenied', 'Acces Denied');
      }
    } catch (error) {
      console.error('Error al buscar cardId en la base de datos:', error);
    }
  }

  if (topic === 'EIASdoorOpened') {

    try {
      const player = await Player.findOne({ cardId: messageStr });

      if (player) {
        console.log(`El jugador que abrió la puerta es: ${player.name}`);

        if (player.socketId) {
          io.to(player.socketId).emit('door_status', { isOpen: true });
          console.log(`Evento 'door_status' emitido solo al jugador: ${player.name} with socket: ${player.socketId}`);
        } else {
          console.log(`El jugador ${player.name} no tiene un socketId asignado.`);
        }
      } else {
        console.log(`No se encontró un jugador con el cardId: ${messageStr}`);
        mqttClient.publish('EIASOpenDoorDenied', 'Access Denied');
      }
    } catch (error) {
      console.error('Error al buscar el cardId en la base de datos:', error);
    }
  }
});

// Manejar mensajes recibidos en el tópico 'EIASidCard'
mqttClient.on('message', (topic, message) => {
  if (topic === 'EIASidCard') {
    const uid = message.toString(); // Convierte el mensaje a string
    console.log(`UID recibido: ${uid}`);
    // Aquí puedes agregar la lógica para manejar el UID recibido si es necesario
  }
});


async function sendNotification(fcmToken,title,body) {
  const message = {
    token: fcmToken,
    notification: {
      title: title,
      body: body,
    },
    data: {
      customDataKey: 'customDataValue',
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}
async function searchUserFCM(email) {
  try {
    const response = await Player.findOne({ email: email }).select('fcmToken');
    if (response && response.fcmToken) {
      return response.fcmToken;
    } else {
      throw new Error('FCM token not found for the specified user');
    }
  } catch (error) {
    console.error('Error retrieving FCM token:', error);
    throw error;
  }
}

async function searchUsersWithRole(role) {
  try {
    const users = await Player.find({ role: role }).select('fcmToken');
    if (users && users.length > 0) {
      // Map to retrieve only fcmTokens
      return users.map(user => user.fcmToken).filter(token => token); // Filter out any undefined tokens
    } else {
      throw new Error(`No users found with role: ${role}`);
    }
  } catch (error) {
    console.error('Error retrieving FCM tokens for role:', error);
    throw error;
  }
}
async function searchUsersWithEmail(email) {
  try {
    const users = await Player.find({ email: email}).select('name');
    if (users && users.length > 0) {
      return users.map(user => user.name); // Retorna solo el nombre
    } else {
      throw new Error(`No se encontraron usuarios con el email: ${email}`);
    }
  } catch (error) {
    console.error('Error al recuperar los nombres:', error);
    throw error;
  }
}

app.post('/send-notification', async (req, res) => {
  console.log("SENDING NOTIFICATION TO ALL MORTIMERS");
  console.log(req.body);
  

  try {
    // Fetch all tokens of users with role "MORTIMER"
    const fcmTokens = await searchUsersWithRole("MORTIMER");
    const userAcces = await searchUsersWithEmail(req.body.email)
    console.log("FCM tokens found:", fcmTokens);

    if (fcmTokens.length === 0) {
      return res.status(404).json({ error: 'No FCM tokens found for role MORTIMER' });
    }

    // Send notification to each token
    await Promise.all(fcmTokens.map(token => sendNotification(token, "Acces granted to", userAcces)));

    res.json({ message: 'Notification sent successfully to all MORTIMERS' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error sending notifications' });
  }
});

app.post('/send-notification-sample', async (req, res) => {
  console.log("SENDING NOTIFICATION");
  
  try {
    const { email } = req.body;
    console.log("Email", email);    
    const fcmToken = await searchUserFCM(email);
    console.log("Fcm token", fcmToken);
    
    if (!fcmToken) {
      return res.status(404).json({ error: 'FCM token not found' });
    }

    await sendNotification(fcmToken, "Acces granted to", email);

    res.json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error sending notification' });
  }
});



// Mantener el uso de start()
start();
                                                      
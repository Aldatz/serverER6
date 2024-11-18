import http from 'http';
import app from './app.js';
import { Server } from 'socket.io';
import './config/mongooseConfig.js';
import { setupSocket } from './services/mqttService.js';
import { deleteMapUser, mortimerGet, updateLocation } from './services/playerService.js';
import { Player } from './Schemas/PlayerSchema.js';
import { Artefact } from './Schemas/ArtefactSchema.js';
import { config } from 'dotenv';

let deviceLocations = {};

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});


io.on('connection', async (socket) => {
  console.log(`Un jugador se ha conectado: ${socket.id}`);

  // Enviar la lista de jugadores (excluyendo los especificados) al cliente que se acaba de conectar
  try {
    const players = await mortimerGet();
    const MORTIMER = await Player.findOne({ email: process.env.MORTIMER_EMAIL });
    const mortimer_socket = MORTIMER?.socketId;

    if (mortimer_socket) {
      socket.to(mortimer_socket).emit('all_players', {
        players: players,
        from: socket.id,
      });
    }
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

  
    // Escuchar el evento 'is_in_hall' para actualizar el estado del jugador
  socket.on('is_in_hall', async (user) => {
    console.log(`Nuevo jugador en el hall: ${user.nickname}`);

    // Emitir la información de todos los jugadores a todos los clientes
    io.emit('players_in_hall', { user, from: socket.id });

    // Opcional: Si quieres que el cliente reciba a todos los jugadores actuales, puedes emitir todos los jugadores al nuevo conectado
    const players = await Player.find(); // Obtener todos los jugadores
    socket.emit('players_in_hall', { players: players, from: socket.id });
  });


  // payers dentro del hall
  socket.on('is_in_hall', async (data) => {
    const { email } = data;
  
    try {
      // Buscar al usuario en la base de datos
      const player = await Player.findOne({ email });
  
      if (!player) {
        console.error(`Usuario con email ${email} no encontrado`);
        socket.emit('error', { message: 'Usuario no encontrado' });
        return;
      }
  
      // Alternar el valor de isInHall
      player.isInHall = !player.isInHall;
  
      // Guardar los cambios
      await player.save();
  
      // Obtener la lista actualizada de usuarios en el Hall
      const usersInHall = await Player.find({ isInHall: true }).select('_id nickname avatar');
  
      // Emitir la lista actualizada a todos los usuarios conectados
      io.emit('send_users_in_hall', usersInHall);
  
      console.log(`Usuario ${email} actualizado con isInHall: ${player.isInHall}`);
    } catch (error) {
      console.error('Error actualizando isInHall:', error);
      socket.emit('error', { message: 'Error actualizando el estado en el Hall' });
    }
  });
  

  // Escucha otros eventos ya definidos
  socket.on('scan_acolyte', async (data) => {
    const { scannedEmail } = data;
    try {
      const acolyte = await Player.findOne({ email: scannedEmail });
      const MORTIMER = await Player.findOne({ email: process.env.MORTIMER_EMAIL });
      const acolyte_socket = acolyte?.socketId;
      const mortimer_socket = MORTIMER?.socketId;

      if (!acolyte) {
        return socket.emit('error', { message: 'Acolyte no encontrado' });
      }

      // Cambiar el estado del Acolyte
      acolyte.is_active = !acolyte.is_active;
      await acolyte.save();
      const players = await mortimerGet();

      if (mortimer_socket) {
        socket.to(mortimer_socket).emit('all_players', {
          players: players,
          from: socket.id,
        });
      }

      // Enviar el estado actualizado al cliente
      socket.emit('acolyte_status_updated', {
        success: true,
        email: acolyte.email,
        is_active: acolyte.is_active,
        message: `Acolyte ahora está ${acolyte.is_active ? 'online' : 'offline'}`,
      });

      // Notificar al Acolyte que fue escaneado
      if (acolyte_socket) {
        socket.to(acolyte_socket).emit('qr_scanned', {
          is_active: acolyte.is_active,
        });

        socket.to(acolyte_socket).emit('change_isInside', {
          data: acolyte.is_active,
          from: socket.id,
        });
      }

      console.log(
        `Estado del Acolyte actualizado: ${acolyte.email} - ${
          acolyte.is_active ? 'online' : 'offline'
        }`
      );
    } catch (error) {
      console.error('Error al cambiar el estado del Acolyte:', error);
      socket.emit('error', { message: 'Error al cambiar el estado del Acolyte' });
    }
  });

  socket.on('is_inside_tower', () => {
    console.log('Se ha recibido un evento is_inside_tower');
    if (process.env.ENABLE_MQTT === 'true') {
      console.log("cerrando puerta");
      mqttClient.publish('EIASAcolyteInside', `mesage`);
    }
  });

  socket.on('location', (location, email) => {
    console.log(`location change for ${email} to :${location}`);
    updateLocation(email, location);
  });

  socket.on('objectTaken', async (data) => {
    const objectId = data.id;
    console.log(`Objeto tomado con ID: ${objectId}`);

    try {
      // Actualizar el campo isTaken en la base de datos
      const updatedartefact = await Artefact.findOneAndUpdate(
        { id: objectId },
        { isTaken: true },
        { new: true }
      );

      if (updatedartefact) {
        console.log(`POI con ID ${objectId} actualizado en MongoDB`);

        // Opcional: Emitir un evento a todos los clientes para actualizar el estado del objeto
        io.emit('poiUpdated', { id: objectId, isTaken: true });
        io.emit('update_artifacts');
      } else {
        console.log(`No se encontró POI con ID ${objectId}`);
      }
    } catch (error) {
      console.error('Error al actualizar el POI en MongoDB:', error);
    }
  });

  socket.on('restore_objects', async () => {
    try {
      // Actualiza todos los artefactos en la base de datos
      await Artefact.updateMany({}, { isTaken: false });

      console.log("All objects restored to isTaken: false");
      io.emit('update_artifacts');
    } catch (error) {
      console.error("Error restoring objects:", error);
    }
  });

  // Escuchar el evento de solicitud de artefactos
  socket.on('request_artifacts', async () => {
    try {
      const artifacts = await Artefact.find(); // Obtener todos los artefactos de la base de datos
      socket.emit('receive_artifacts', artifacts); // Enviar artefactos al cliente
    } catch (error) {
      console.error("Error fetching artifacts:", error);
    }
  });

  // Ubicación de los dispositivos
  socket.on('locationUpdate', (data) => {
    const { userId, coords, avatar } = data;
    deviceLocations[userId] = { coords, avatar }; // Guardar ubicación por ID de usuario
  
    // Broadcast location to all clients
    io.emit('deviceLocations', deviceLocations);
  });

  socket.on('delete_map_user', (nickname) => {
    console.log(`deleted user ${nickname} from the map`);
    deviceLocations = deleteMapUser(email, deviceLocations);
    console.log('Users: ', deviceLocations);
    io.emit('deviceLocations',deviceLocations);
  });

  socket.on('disconnect', () => {
    console.log(`Jugador desconectado: ${socket.id}`);
  });
});

// Inicializar MQTT si está habilitado
let mqttClient = null;

if (process.env.ENABLE_MQTT === 'true') {
  (async () => {
    const { default: mqttClientModule } = await import('./config/mqttConfig.js');
    mqttClient = mqttClientModule;

    const { setupSocket } = await import('./services/mqttService.js');
    setupSocket(io, mqttClient);
  })();
}

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

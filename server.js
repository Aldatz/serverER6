// server.js
import http from 'http';
import app from './app.js';
import { Server } from 'socket.io';
import './config/mongooseConfig.js';
import { setupSocket } from './services/mqttService.js';
import { mortimerGet } from './services/playerService.js';
import { Player } from './Schemas/PlayerSchema.js';
import { config } from 'dotenv';

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

  // Escucha de un evento personalizado para cambiar el estado de un Acolyte
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
    // Publicar un mensaje vacío en el tópico MQTT
    console.log("cerranod puerta");
    mqttClient.publish('EIASAcolyteInside', `mesage`);
    }
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

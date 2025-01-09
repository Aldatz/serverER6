import http from 'http';
import app from './app.js';
import { Server } from 'socket.io';
import './config/mongooseConfig.js';
import { setupSocket } from './services/mqttService.js';
import { AngeloDelivered, AngeloREduced, deleteMapUser, mortimerGet, updateLocation, validateAllArtifacts } from './services/playerService.js';
import { Player } from './Schemas/PlayerSchema.js';
import { Artefact } from './Schemas/ArtefactSchema.js';
import { config } from 'dotenv';
import { setBetrayer } from './services/playerService.js';
import { scheduleCronJobs } from './cron/cronJobs.js';

let deviceLocations = {};
let fightState = {
  inProgress: false,
  acolytePower: 0,
  angeloPower: 100,
};

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

scheduleCronJobs();

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

  socket.on('is_in_hall', async (data) => {
    const { email, isInHall } = data;
    
    try {
        const player = await Player.findOne({ email });

        if (!player) {
            console.error(`Usuario con email ${email} no encontrado`);
            socket.emit('error', { message: 'Usuario no encontrado' });
            return;
        }

        player.isInHall = isInHall;
        await player.save();

        console.log(`Usuario ${email} actualizado con isInHall: ${player.isInHall}`);

            // Si no es "VILLAIN", se buscan los usuarios en el Hall excluyendo a los "VILLAIN"
            const usersInHall = await Player.find({
              isInHall: true,
            }).select('_id nickname avatar role');

            // Notificar a todos los usuarios conectados
            io.emit('send_users_in_hall', usersInHall);
        }
    catch (error) {
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

  socket.on('Betrayer', (decision,email) => {
    console.log(`Decision taken for ${email} Decision:${decision}`);
    setBetrayer(email,decision);
  });
  socket.on('AngeloFound', () => {
    console.log(`AngeloWasFound`);
    io.emit('AngeloWasFound');
    
  });

  socket.on('play_animation_acolytes', () => {
    console.log(`emiting play animation`);
    io.emit('play_animation_all_acolytes');
  });

  socket.on('play_animation_mortimer', () => {
    console.log(`emiting play animation`);
    io.emit('play_animation_all_mortimers');
  });

  socket.on('search_validation', (validation) => {
    console.log(`validation arrived`);
    io.emit('Validation_acolytes',validation);
    if (validation === true) {
    io.emit('updatedPlayer',validation); 
    validateAllArtifacts();
    }
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
        io.emit('update_artifacts',updatedartefact);
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

  socket.on('delete_map_user', async (nickname) => {
    console.log(`deleted user ${nickname} from the map`);
    deviceLocations = await deleteMapUser(nickname, deviceLocations);
    console.log('Users: ', deviceLocations);
    io.emit('deviceLocations',deviceLocations);
  });
  // socket.on('change_location_tower', (player) => {
  //   updateLocation(player,'Tower');
  //   console.log(`location changed to tower for ${player}`);
  // });

  socket.on('player_update_curse_disease', async (payload) => {
    try {
      const { playerId, diseases, ethaziumCursed } = payload;
      console.log('player_update_curse_disease:', payload);

      // 1) Buscar al jugador
      const player = await Player.findById(playerId);
      if (!player) {
        console.log('Jugador no encontrado con _id:', playerId);
        return;
      }

      // 2) Actualizar enfermedad
      // Si solo manejas una enfermedad a la vez,
      // tomas la primera de "diseases" o pones null si no hay ninguna
      const newDisease = diseases && diseases.length > 0 ? diseases[0] : null;
      
      // Si no está en la base, lo definimos:
      // playerSchema define: disease: { type: String, enum: [...], default: null }
      player.disease = newDisease; 

      // 3) Actualizar maldición Ethazium
      // playerSchema define: ethaziumCursed: { type: Boolean, default: false }
      player.ethaziumCursed = ethaziumCursed;

      // 4) Guardar cambios
      await player.save();
      console.log(`Jugador ${player.nickname} actualizado: disease=${player.disease}, ethaziumCursed=${player.ethaziumCursed}`);

      // 5) Emitir eventos para que todos (o el propio jugador) se enteren y reactualicen en local

      // Caso: enfermedad
      if (newDisease) {
        // Se aplicó una enfermedad
        socket.to(player.socketId).emit('applied_disease', {
          playerId,
          disease: newDisease,
          applied: true,
        });
      } else {
        // No hay disease => se retiró
        socket.to(player.socketId).emit('applied_disease', {
          playerId,
          disease: '', // o la anterior si la necesitas
          applied: false,
        });
      }

      // Caso: maldición Ethazium
      socket.to(player.socketId).emit('applied_curse', {
        playerId,
        curse: ethaziumCursed,
      });

    } catch (err) {
      console.error('Error en player_update_curse_disease:', err);
    }
  });


  // -- ESTADO COMPARTIDO --
let progress = 50;           // Barra de 0 a 100
let inProgress = false;      // Bandera de "batalla en curso"
let pushInterval = null;     // Intervalo para que Angelo empuje

// -- FUNCIONES DE BARRA --
function startBattle() {
  if (inProgress) return;    // Evitar dos batallas simultáneas
  inProgress = true;
  progress = 50;             // Empezamos a la mitad

  // Emitir a todos que la batalla inicia (y la barra actual)
  io.emit('battle_started', { progress });

  // Crear un intervalo que cada X ms sube la barra en 1
  pushInterval = setInterval(() => {
    progress += 5;
    if (progress > 100) {
      progress = 100;
      endBattle('AngeloWins');
    } else {
      io.emit('battle_update', { progress });
    }
  }, 200); // 500 ms, ajústalo a tu gusto
}

function reduceAngelo(value) {
  // Bajar la barra
  progress -= value;
  if (progress < 0) {
    progress = 0;
    endBattle('AcolytesWin');
  } else {
    io.emit('battle_update', { progress });
  }
}

async function endBattle(result) {
  if (pushInterval) {
    clearInterval(pushInterval);
    pushInterval = null;
  }
  inProgress = false;

  try {
    await AngeloREduced(); 
  } catch (error) {
    console.error('Error en AngeloReduced:', error);
  }

  io.emit('battle_end', { result, progress });
}

socket.on('Angelo_delivered', () => {
    
    io.emit('Validate_angelo');
    //io.emit('AngeloDeliveredSuccesfully');
});

  // Servidor escucha la respuesta del cliente
  socket.on('Validate_angelo_response', (payload) => {
    console.log('Respuesta a Validate_angelo:', payload);
    if(payload.validated){
      AngeloDelivered();
      io.emit('AngeloDeliveredSuccesfully');
    }
    else{
      io.emit('AngeloDeliveredFailed');
    }
  });

  socket.on('rest_request', async (payload) => {
    try {
      console.log('Rest request:', payload);
      const { email } = payload;

      // 1) Buscar al jugador por email
      const player = await Player.findOne({ email });
      if (!player) {
        console.log('Player not found by email:', email);
        return;
      } else {
        console.log('Player found:', player.name);
      }

      // 2) Actualizar su resistencia
      player.resistance = 100;
      await player.save();

      console.log(`Player ${player.email} now has resistance=100`);

      // 3) Emitir un evento de "rest_applied" si deseas notificar al cliente
      socket.to(player.socketId).emit('rest_applied', {
        email,
        newResistance: 100,
      });
    } catch (err) {
      console.error('Error en rest_request:', err);
    }
  });

// Un cliente solicita iniciar batalla
socket.on('start_angelo_battle', () => {
  startBattle();
});

// Reducir la barra (tap)
socket.on('reduce_angelo', (data) => {
  if (!inProgress) return;
  const value = data?.value || 5;
  reduceAngelo(value);
});

// (Opcional) Cancelar batalla, etc.
socket.on('cancel_battle', () => {
  endBattle('Cancelled');
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

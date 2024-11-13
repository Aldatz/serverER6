// services/mqttService.js
import { mortimerGet } from './playerService.js';
import { Player } from '../Schemas/PlayerSchema.js';

export const setupSocket = (io, mqttClient) => {
   if (!mqttClient) {
        console.log('mqttClient no está disponible. MQTT está deshabilitado.');
    return;
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
    console.log('No está conectado al broker MQTT');
  });

  mqttClient.on('connect', () => {
    console.log('Conectado al broker MQTT');
    mqttClient.subscribe(['EIASidCard', 'EIASdoorOpened'], (err) => {
      if (err) {
        console.error('Error al suscribirse a los tópicos:', err);
      } else {
        console.log('Suscrito a los tópicos EIASidCard y EIASdoorOpened');
      }
    });
  });

  mqttClient.on('message', async (topic, message) => {
    const messageStr = message.toString().trim();
    if (topic === 'is_inside_tower') {
        mqttClient.publish('EIASAcolyteInside', `mesage`);
    }
    if (topic === 'EIASidCard') {
      const receivedCardId = message.toString().trim();
      try {
        // Buscar en la base de datos un jugador con el cardId recibido
        const player = await Player.findOne({ cardId: receivedCardId });
  
        if (player) {
          console.log(`UID recibido coincide con cardId en la base de datos para el jugador: ${player.name}`);
          if(player.location === 'Tower'){  
            mqttClient.publish('EIASOpenDoor', `${player.name}`);
          }
          else{
            mqttClient.publish('EIASOpenDoorDenied', 'Acces Denied, not in the tower');
          }
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
            console.log(player.is_inside_tower);
            
            player.is_inside_tower = !player.is_inside_tower;
            await player.save();
            console.log(player.is_inside_tower);
            if (player.location === 'tower') {
                io.to(player.socketId).emit('door_status', { isOpen:  player.is_inside_tower});
            }
            else{
                mqttClient.publish('EIASOpenDoorDenied', 'Access Denied, not in the Tower');
            }
            
            try {
              // Obtenemos todos los jugadores
              const players = await mortimerGet();
              
              // Buscamos el jugador MORTIMER
              const MORTIMER = await Player.findOne({ email: process.env.MORTIMER_EMAIL });
              const mortimer_socket = MORTIMER?.socketId;
    
              console.log('Socket de MORTIMER:', mortimer_socket);
    
              // Aseguramos que mortimer_socket es válido antes de emitir
              if (mortimer_socket) {
                io.to(mortimer_socket).emit('all_players', {
                  players: players,
                  from: player.socketId,
                });
                console.log(`Evento 'all_players' emitido a MORTIMER con socketId: ${mortimer_socket}`);
              } else {
                console.error('El socketId de MORTIMER no está definido o no es válido.');
              }
    
            } catch (error) {
              console.error('Error al obtener la lista de jugadores o al emitir a MORTIMER:', error);
              socket.emit('error', { message: 'Error al obtener la lista de jugadores.' });
            }
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
};
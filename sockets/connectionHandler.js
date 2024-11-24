// sockets/connectionHandler.js

import { mortimerGet } from '../services/playerService.js';
import { Player } from '../Schemas/PlayerSchema.js';

const connectionHandler = async (socket, io) => {
  // Enviar la lista de jugadores al cliente que se acaba de conectar
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
  } catch (error) {
    socket.emit('error', { message: 'Error al obtener el correo del jugador' });
  }
};

export default connectionHandler;
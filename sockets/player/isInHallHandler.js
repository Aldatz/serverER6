// sockets/player/isInHallHandler.js
import { Player } from '../../Schemas/PlayerSchema.js';

const isInHallHandler = (socket, io) => {
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

      const usersInHall = await Player.find({
        isInHall: true,
      }).select('_id nickname avatar role');

      // Notificar a todos los usuarios conectados
      io.emit('send_users_in_hall', usersInHall);
    } catch (error) {
      console.error('Error actualizando isInHall:', error);
      socket.emit('error', { message: 'Error actualizando el estado en el Hall' });
    }
  });
};

export default isInHallHandler;
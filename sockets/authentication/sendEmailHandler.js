// sockets/authentication/sendEmailHandler.js
import { Player } from '../../Schemas/PlayerSchema.js';

const sendEmailHandler = (socket) => {
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
};

export default sendEmailHandler;
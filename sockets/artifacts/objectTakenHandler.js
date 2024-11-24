// sockets/artifacts/objectTakenHandler.js

import { Artefact } from '../../Schemas/ArtefactSchema.js';

const objectTakenHandler = (socket, io) => {
  socket.on('objectTaken', async (data) => {
    const objectId = data.id;
    console.log(`Objeto tomado con ID: ${objectId}`);

    try {
      // Actualizar el campo isTaken en la base de datos
      const updatedArtefact = await Artefact.findOneAndUpdate(
        { id: objectId },
        { isTaken: true },
        { new: true }
      );

      if (updatedArtefact) {
        console.log(`POI con ID ${objectId} actualizado en MongoDB`);

        // Emitir un evento a todos los clientes para actualizar el estado del objeto
        io.emit('poiUpdated', { id: objectId, isTaken: true });
        io.emit('update_artifacts', updatedArtefact);
      } else {
        console.log(`No se encontró POI con ID ${objectId}`);
      }
    } catch (error) {
      console.error('Error al actualizar el POI en MongoDB:', error);
    }
  });
};

export default objectTakenHandler;
// sockets/artifacts/restoreObjectsHandler.js

import { Artefact } from '../../Schemas/ArtefactSchema.js';

const restoreObjectsHandler = (socket, io) => {
  socket.on('restore_objects', async () => {
    try {
      // Actualiza todos los artefactos en la base de datos
      await Artefact.updateMany({}, { isTaken: false });

      console.log('All objects restored to isTaken: false');
      io.emit('update_artifacts');
    } catch (error) {
      console.error('Error restoring objects:', error);
    }
  });
};

export default restoreObjectsHandler;
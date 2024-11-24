// sockets/artifacts/requestArtifactsHandler.js

import { Artefact } from '../../Schemas/ArtefactSchema.js';

const requestArtifactsHandler = (socket) => {
  socket.on('request_artifacts', async () => {
    try {
      const artifacts = await Artefact.find(); // Obtener todos los artefactos de la base de datos
      socket.emit('receive_artifacts', artifacts); // Enviar artefactos al cliente
    } catch (error) {
      console.error('Error fetching artifacts:', error);
    }
  });
};

export default requestArtifactsHandler;
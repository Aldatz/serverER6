// sockets/index.js
import connectionHandler from './connectionHandler.js';
import sendEmailHandler from './authentication/sendEmailHandler.js';
import isInHallHandler from './player/isInHallHandler.js';
import scanAcolyteHandler from './player/scanAcolyteHandler.js';
import locationHandler from './player/locationHandler.js';
import playAnimationHandler from './game/playAnimationHandler.js';
import searchValidationHandler from './game/searchValidationHandler.js';
import objectTakenHandler from './artifacts/objectTakenHandler.js';
import restoreObjectsHandler from './artifacts/restoreObjectsHandler.js';
import requestArtifactsHandler from './artifacts/requestArtifactsHandler.js';
import locationUpdateHandler from './map/locationUpdateHandler.js';
import deleteMapUserHandler from './map/deleteMapUserHandler.js';

export const setupSocketHandlers = (io) => {
  io.on('connection', async (socket) => {
    console.log(`Un jugador se ha conectado: ${socket.id}`);

    // Configurar los handlers
    await connectionHandler(socket, io);
    sendEmailHandler(socket);
    isInHallHandler(socket, io);
    scanAcolyteHandler(socket, io);
    locationHandler(socket);
    playAnimationHandler(socket, io);
    searchValidationHandler(socket, io);
    objectTakenHandler(socket, io);
    restoreObjectsHandler(socket, io);
    requestArtifactsHandler(socket);
    locationUpdateHandler(socket, io);
    deleteMapUserHandler(socket, io);

    socket.on('disconnect', () => {
      console.log(`Jugador desconectado: ${socket.id}`);
    });
  });
};
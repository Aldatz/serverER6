// sockets/map/locationUpdateHandler.js

import deviceLocations from '../shared/deviceLocations.js';

const locationUpdateHandler = (socket, io) => {
  socket.on('locationUpdate', (data) => {
    const { userId, coords, avatar } = data;
    deviceLocations[userId] = { coords, avatar }; // Guardar ubicación por ID de usuario

    // Broadcast location to all clients
    io.emit('deviceLocations', deviceLocations);
  });
};

export default locationUpdateHandler;
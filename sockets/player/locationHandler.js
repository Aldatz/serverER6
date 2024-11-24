// sockets/player/locationHandler.js

import { updateLocation } from '../../services/playerService.js';

const locationHandler = (socket) => {
  socket.on('location', (location, email) => {
    console.log(`location change for ${email} to :${location}`);
    updateLocation(email, location);
  });
};

export default locationHandler;
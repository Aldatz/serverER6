// sockets/game/searchValidationHandler.js

import { validateAllArtifacts } from '../../services/playerService.js';

const searchValidationHandler = (socket, io) => {
  socket.on('search_validation', (validation) => {
    console.log(`validation arrived`);
    io.emit('Validation_acolytes', validation);
    if (validation === true) {
      io.emit('updatedPlayer', validation);
      validateAllArtifacts();
    }
  });
};

export default searchValidationHandler;
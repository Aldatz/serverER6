// sockets/map/deleteMapUserHandler.js

import { deleteMapUser } from '../../services/playerService.js';
import deviceLocations from '../shared/deviceLocations.js';

const deleteMapUserHandler = (socket, io) => {
  socket.on('delete_map_user', async (nickname) => {
    console.log(`deleted user ${nickname} from the map`);
    await deleteMapUser(nickname, deviceLocations);
    console.log('Users: ', deviceLocations);
    io.emit('deviceLocations', deviceLocations);
  });
};

export default deleteMapUserHandler;
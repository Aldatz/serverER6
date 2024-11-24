// sockets/game/playAnimationHandler.js

const playAnimationHandler = (socket, io) => {
    socket.on('play_animation_acolytes', () => {
      console.log(`emitting play animation`);
      io.emit('play_animation_all_acolytes');
    });
  
    socket.on('play_animation_mortimer', () => {
      console.log(`emitting play animation`);
      io.emit('play_animation_all_mortimers');
    });
  };
  
  export default playAnimationHandler;
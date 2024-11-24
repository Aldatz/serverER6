// server.js

import http from 'http';
import app from './app.js';
import { Server } from 'socket.io';
import './config/mongooseConfig.js';
import { config } from 'dotenv';
import { setupSocketHandlers } from './sockets/index.js';

// Resto de tus importaciones
import './config/mongooseConfig.js';
import { setupSocket } from './services/mqttService.js';

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Configurar los sockets utilizando los handlers modularizados
setupSocketHandlers(io);

// Inicializar MQTT si está habilitado
let mqttClient = null;

if (process.env.ENABLE_MQTT === 'true') {
  (async () => {
    const { default: mqttClientModule } = await import('./config/mqttConfig.js');
    mqttClient = mqttClientModule;

    const { setupSocket } = await import('./services/mqttService.js');
    setupSocket(io, mqttClient);
  })();
}

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
// config/mqttConfig.js
import mqtt from 'mqtt';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

let mqttClient = null;

if (process.env.ENABLE_MQTT === 'true') {
  const options = {
    port: process.env.MQTT_PORT || 8883,
    clientId: 'SERVER_EIAS',
    ca: fs.readFileSync('certificates/ca.crt'),
    cert: fs.readFileSync('certificates/server.crt'),
    key: fs.readFileSync('certificates/eias.key'),
    rejectUnauthorized: true,
  };

  mqttClient = mqtt.connect(`mqtts://${process.env.MQTT_SERVER}`, options);
  console.log('MQTT Client initialized.');
} else {
  console.log('MQTT está deshabilitado.');
}

export default mqttClient;
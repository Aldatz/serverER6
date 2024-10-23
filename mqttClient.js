// src/mqttClient.js

import mqtt from 'mqtt';
import EventEmitter from 'events';
import { env } from 'process';

class MQTTClient extends EventEmitter {
  constructor(options) {
    super();
    this.options = options;
    this.client = null;
    this.connect();
  }

  connect() {
    this.client = mqtt.connect(this.options);

    this.client.on('connect', () => {
      console.log('Conectado al broker MQTT');
      this.client.subscribe('EIAS_idcard', (err) => {
        if (!err) {
          console.log('Suscrito al tópico: verificar');
        } else {
          console.error('Error al suscribirse al tópico:', err);
        }
      });
    });

    this.client.on('message', (topic, message) => {
      const msg = message.toString();
      console.log(`Mensaje recibido en ${topic}: ${msg}`);
      this.emit('message', topic, msg);
    });

    this.client.on('error', (err) => {
      console.error('Error en la conexión MQTT:', err);
      this.client.end();
    });

    this.client.on('close', () => {
      console.log('Conexión MQTT cerrada');
      setTimeout(() => {
        console.log('Intentando reconectar al broker MQTT...');
        this.connect();
      }, 5000);
    });
  }

  publish(topic, message) {
    this.client.publish(topic, message, (err) => {
      if (err) {
        console.error(`Error al publicar en ${topic}:`, err);
      } else {
        console.log(`Mensaje publicado en ${topic}: ${message}`);
      }
    });
  }
}

export default MQTTClient;

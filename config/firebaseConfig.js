// config/firebaseConfig.js
import { initializeApp } from 'firebase-admin/app';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Inicializa Firebase Admin usando las credenciales del archivo .env
const firebaseCredentials = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

initializeApp({
  credential: admin.credential.cert(firebaseCredentials),
});

export default admin;
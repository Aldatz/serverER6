// services/notificationService.js
import admin from '../config/firebaseConfig.js';
import { Player } from '../Schemas/PlayerSchema.js';

export const sendNotification = async (fcmToken, title, body, screen) => {
  const message = {
    token: fcmToken,
    notification: {
      title: title,
      body: body,
    },
    data: {
      customDataKey: 'customDataValue',
      screen: screen,
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

export const searchUserFCM = async (email) => {
  try {
    const response = await Player.findOne({ email }).select('fcmToken');
    if (response && response.fcmToken) {
      return response.fcmToken;
    } else {
      throw new Error('FCM token not found for the specified user');
    }
  } catch (error) {
    console.error('Error retrieving FCM token:', error);
    throw error;
  }
};

export const searchUsersWithRole = async (role) => {
  try {
    const users = await Player.find({ role }).select('fcmToken');
    if (users && users.length > 0) {
      return users.map((user) => user.fcmToken).filter((token) => token);
    } else {
      throw new Error(`No users found with role: ${role}`);
    }
  } catch (error) {
    console.error('Error retrieving FCM tokens for role:', error);
    throw error;
  }
};

export const searchUsersWithEmail = async (email) => {
  try {
    const users = await Player.find({ email }).select('name');
    if (users && users.length > 0) {
      return users.map((user) => user.name);
    } else {
      throw new Error(`No se encontraron usuarios con el email: ${email}`);
    }
  } catch (error) {
    console.error('Error al recuperar los nombres:', error);
    throw error;
  }
};
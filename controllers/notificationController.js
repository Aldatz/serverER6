// controllers/notificationController.js
import {
    searchUsersWithRole,
    searchUsersWithEmail,
    sendNotification,
  } from '../services/notificationService.js';
  import { Player } from '../Schemas/PlayerSchema.js';
  
  export const sendNotificationToMortimers = async (req, res) => {
    console.log('SENDING NOTIFICATION TO ALL MORTIMERS');
    console.log(req.body);
  
    try {
      const fcmTokens = await searchUsersWithRole('MORTIMER');
      const userAcces = await searchUsersWithEmail(req.body.email);
      console.log('FCM tokens found:', fcmTokens);
      console.log('USER:', userAcces[0]);
  
      if (fcmTokens.length === 0) {
        return res.status(404).json({ error: 'No FCM tokens found for role MORTIMER' });
      }
  
      const isInsideTower = await Player.findOne({ name: userAcces[0] }).select('is_inside_tower');
      console.log('isopen');
      console.log(userAcces[0]);
      console.log('isinside');
      console.log(isInsideTower.is_inside_tower);
  
      if (isInsideTower.is_inside_tower === true) {
        await Promise.all(
          fcmTokens.map((token) =>
            sendNotification(token, '!Hey Boss¡ Acces granted to', userAcces[0])
          )
        );
      } else {
        await Promise.all(
          fcmTokens.map((token) =>
            sendNotification(token, '!Hey Boss¡ An Acolythe is leaving the tower:', userAcces[0])
          )
        );
      }
      res.json({ message: 'Notification sent successfully to all MORTIMERS' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error sending notifications' });
    }
  };
  
  export const sendNotificationSample = async (req, res) => {
    console.log('SENDING NOTIFICATION');
  
    try {
      const { email } = req.body;
      console.log('Email', email);
      const fcmToken = await searchUserFCM(email);
      console.log('Fcm token', fcmToken);
  
      if (!fcmToken) {
        return res.status(404).json({ error: 'FCM token not found' });
      }
  
      await sendNotification(fcmToken, 'Acces granted to', email);
  
      res.json({ message: 'Notification sent successfully' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error sending notification' });
    }
  };

  export const sendObituarioNotificationToMortimers = async (req, res) => {
    console.log('SENDING OBITUARIO NOTIFICATION TO ALL MORTIMERS');
  
    try {
      const fcmTokens = await searchUsersWithRole('MORTIMER');
      console.log('FCM tokens found:', fcmTokens);  
      if (fcmTokens.length === 0) {
        return res.status(404).json({ error: 'No FCM tokens found for role MORTIMER' });
      }
    
      await Promise.all(
        fcmTokens.map((token) =>
          sendNotification(token, '!Hey Boss¡ The Acolytes are waiting for you in the Hall of Sages','','HallOfSages')
        )
      );
      
      res.json({ message: 'Notification sent successfully to all MORTIMERS' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error sending notifications' });
  }};
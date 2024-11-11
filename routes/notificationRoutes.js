// routes/notificationRoutes.js
import express from 'express';
import {
  sendNotificationToMortimers,
  sendNotificationSample,
} from '../controllers/notificationController.js';

const router = express.Router();

router.post('/send-notification', sendNotificationToMortimers);
router.post('/send-notification-sample', sendNotificationSample);

export default router;
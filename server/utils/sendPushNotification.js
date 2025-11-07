// server/utils/sendPushNotification.js
import { Expo } from 'expo-server-sdk';
import User from '../models/User.js';

const expo = new Expo();

/**
 * Send a push notification to a user by userId or pushToken
 * @param {Object} param0
 * @param {String} param0.userId - MongoDB user _id
 * @param {String} param0.pushToken - Expo push token (optional if userId provided)
 * @param {String} param0.title - Notification title
 * @param {String} param0.body - Notification body
 * @param {Object} param0.data - Extra data to send
 * @returns {Promise<Object>} Result of push notification
 */
export async function sendPushNotification({ userId, pushToken, title, body, data }) {
  let token = pushToken;
  if (!token && userId) {
    const user = await User.findById(userId);
    token = user?.pushToken;
  }
  if (!token || !Expo.isExpoPushToken(token)) {
    return { error: 'Invalid or missing Expo push token' };
  }
  const messages = [{
    to: token,
    sound: 'default',
    title,
    body,
    data,
  }];
  try {
    const receipts = await expo.sendPushNotificationsAsync(messages);
    return { success: true, receipts };
  } catch (err) {
    return { error: err.message };
  }
}

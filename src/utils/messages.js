import axios from 'axios';
import { API_BASE_URL } from '../config/env';

export async function sendMessageToUser(senderId, recipientId, content) {
  const res = await axios.post(`${API_BASE_URL}/api/message/send`, {
    senderId,
    recipientId,
    content,
  });
  return res.data;
}

export async function fetchInboxMessages(userId) {
  const res = await axios.get(`${API_BASE_URL}/api/message/inbox/${userId}`);
  return res.data;
}

export async function replyToMessage(senderId, recipientId, content) {
  const res = await axios.post(`${API_BASE_URL}/api/message/reply`, {
    senderId,
    recipientId,
    content,
  });
  return res.data;
}

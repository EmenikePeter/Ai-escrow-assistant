import { API_BASE_URL } from '@env';
import axios from 'axios';

export async function sendHelpIssue(userId, category, subject, message) {
  const res = await axios.post(`${API_BASE_URL}/api/help/issue`, {
    email: userId, // assuming userId is the user's email
    category,
    message: subject || message,
  });
  return res.data;
}

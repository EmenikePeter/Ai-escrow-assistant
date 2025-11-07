import { API_BASE_URL } from '@env';
import axios from 'axios';

export async function canChatWith(currentEmail, otherEmail) {
  if (!currentEmail || !otherEmail) return false;
  try {
    const res = await axios.post(`${API_BASE_URL}/api/connections/can-chat`, {
      currentEmail,
      otherEmail,
    });
    return res.data.allowed;
  } catch {
    return false;
  }
}

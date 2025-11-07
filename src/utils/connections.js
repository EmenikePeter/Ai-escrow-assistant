// Utility to fetch connection status for a list of users
import { API_BASE_URL } from '@env';
import axios from 'axios';

export async function fetchConnectionStatuses(currentEmail, userEmails) {
  if (!currentEmail || !userEmails?.length) return {};
  try {
    const res = await axios.post(`${API_BASE_URL}/api/connections/statuses`, {
      currentEmail,
      userEmails,
    });
    return res.data; // { email: { status: 'accepted'|'pending'|'none', direction: 'sent'|'received'|null } }
  } catch {
    return {};
  }
}

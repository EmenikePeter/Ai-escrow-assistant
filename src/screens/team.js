import { API_BASE_URL } from '@env';
import axios from 'axios';

export async function fetchTeamMembers() {
  const res = await axios.get(`${API_BASE_URL}/api/support/team`);
  return res.data;
}

export async function updateUserRole(userId, role) {
  const res = await axios.post(`${API_BASE_URL}/api/support/update-role`, { userId, role });
  return res.data;
}

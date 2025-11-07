import { API_BASE_URL } from '@env';
import axios from 'axios';

export async function fetchAllUsers(search = '') {
  const res = await axios.get(`${API_BASE_URL}/api/users`, {
    params: { search }
  });
  return res.data;
}

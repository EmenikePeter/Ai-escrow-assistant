import axios from 'axios';
import { API_BASE_URL } from '../config/env';

export async function fetchAllUsers(search = '') {
  const res = await axios.get(`${API_BASE_URL}/api/users`, {
    params: { search }
  });
  return res.data;
}

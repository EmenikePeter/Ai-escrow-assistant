import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export async function apiRequest(method, url, data = null) {
  const token = await AsyncStorage.getItem('token');
  const config = {
    method,
    url,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    ...(data ? { data } : {})
  };
  return axios(config);
}

export async function getWithAuth(url) {
  return apiRequest('get', url);
}

export async function postWithAuth(url, data) {
  return apiRequest('post', url, data);
}

export async function putWithAuth(url, data) {
  return apiRequest('put', url, data);
}

export async function deleteWithAuth(url) {
  return apiRequest('delete', url);
}

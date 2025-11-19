import axios from 'axios';
import { API_BASE_URL } from '../config/env';

// Use API_BASE_URL from .env

export const generateClause = async (payload) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/generate-clause`,
      { ...payload, model: 'gpt-3.5-turbo' }
    );
    const output = response?.data?.output;
    if (Array.isArray(output) && output.length > 0) {
      return output;
    }
    if (typeof output === 'string' && output.trim().length > 0) {
      return [output];
    }
    const backendError = response?.data?.error;
    throw new Error(backendError ? `API error: ${backendError}` : 'No clause returned from API');
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.error || error.response.data?.body || error.response.statusText;
      throw new Error(`Server error: ${error.response.status} ${message}`.trim());
    }
    if (error.request) {
      throw new Error('No response from backend. Is the API running?');
    }
    throw new Error(`Request error: ${error.message}`);
  }
};

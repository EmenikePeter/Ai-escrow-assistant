import { API_BASE_URL } from '@env';
import axios from 'axios';

// Use API_BASE_URL from .env

export const generateClause = async (payload) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/generate-clause`,
      { ...payload, model: 'gpt-3.5-turbo' }
    );
    if (response.data && response.data.output) {
      return response.data.output;
    }
    if (response.data && response.data.error) {
      return `API error: ${response.data.error}`;
    }
    return 'No clause generated. Please try again or check API logs.';
  } catch (error) {
    if (error.response) {
      return `Server error: ${error.response.status} ${error.response.data?.error || error.response.data?.body || error.response.statusText}`;
    } else if (error.request) {
      return 'No response from backend. Is the API running?';
    } else {
      return `Request error: ${error.message}`;
    }
  }
};

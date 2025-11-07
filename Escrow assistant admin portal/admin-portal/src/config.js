const sanitizeUrl = (url) => (url || '').trim().replace(/\/$/, '');

const resolveBaseUrl = () => {
  const envUrl = sanitizeUrl(process.env.REACT_APP_API_BASE_URL);
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined' && window.location) {
    return sanitizeUrl(window.location.origin);
  }
  return '';
};

export const API_BASE_URL = resolveBaseUrl();

export const SOCKET_OPTIONS = {
  transports: ['websocket'],
  withCredentials: true,
};

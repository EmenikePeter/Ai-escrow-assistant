import { API_BASE_URL as envApiBaseUrl } from '@env';

const runtimeEnv = typeof process !== 'undefined' ? process.env ?? {} : {};
const resolvedApiBaseUrl =
  envApiBaseUrl ||
  runtimeEnv.EXPO_PUBLIC_API_BASE_URL ||
  runtimeEnv.API_BASE_URL ||
  '';

if (!resolvedApiBaseUrl) {
  const message =
    'API_BASE_URL is not configured. Set API_BASE_URL or EXPO_PUBLIC_API_BASE_URL to enable API requests.';
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.warn(message);
  } else {
    throw new Error(message);
  }
}

export const API_BASE_URL = resolvedApiBaseUrl;

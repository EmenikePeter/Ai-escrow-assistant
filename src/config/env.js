import { API_BASE_URL as envApiBaseUrl } from '@env';

const runtimeEnv = typeof process !== 'undefined' ? process.env ?? {} : {};
const resolvedApiBaseUrl =
  envApiBaseUrl ||
  runtimeEnv.EXPO_PUBLIC_API_BASE_URL ||
  runtimeEnv.API_BASE_URL ||
  '';

const sanitizeApiBaseUrl = (value) => {
  if (!value || typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  // Strip inline annotations such as " (optional fallback)" that may come from copied env values.
  const withoutComment = trimmed.replace(/\s+\(.*\)$/, '');
  const [firstToken] = withoutComment.split(/\s+/);
  if (!firstToken) {
    return '';
  }

  const candidate = firstToken.includes('://') ? firstToken : `https://${firstToken}`;

  try {
    const url = new URL(candidate);
    const normalizedPath = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '');
    return `${url.origin}${normalizedPath}`;
  } catch (error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('[env] Ignored invalid API_BASE_URL value:', value, error);
    }
    return '';
  }
};

const sanitizedApiBaseUrl = sanitizeApiBaseUrl(resolvedApiBaseUrl);

if (!sanitizedApiBaseUrl) {
  const message =
    'API_BASE_URL is not configured. Set API_BASE_URL or EXPO_PUBLIC_API_BASE_URL to enable API requests.';
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.warn(message);
  } else {
    throw new Error(message);
  }
}

if (sanitizedApiBaseUrl !== resolvedApiBaseUrl) {
  console.warn(
    '[env] Normalized API_BASE_URL value. Original:',
    resolvedApiBaseUrl,
    '-> Using:',
    sanitizedApiBaseUrl
  );
}

export const API_BASE_URL = sanitizedApiBaseUrl;

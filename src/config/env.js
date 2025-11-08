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

const FALLBACK_API_BASE_URL = 'https://api.ai-escrowassistant.com';

const sanitizedEnvValue = sanitizeApiBaseUrl(resolvedApiBaseUrl);

let sanitizedApiBaseUrl = sanitizedEnvValue;
if (!sanitizedApiBaseUrl) {
  sanitizedApiBaseUrl = FALLBACK_API_BASE_URL;
} else {
  try {
    const { hostname } = new URL(sanitizedApiBaseUrl);
    const deprecatedHosts = new Set([
      'ai-escrowassistant.com',
      'www.ai-escrowassistant.com'
    ]);
    if (deprecatedHosts.has(hostname.toLowerCase())) {
      console.warn(
        '[env] Detected deprecated API_BASE_URL host. Overriding to API endpoint:',
        sanitizedApiBaseUrl,
        '->',
        FALLBACK_API_BASE_URL
      );
      sanitizedApiBaseUrl = FALLBACK_API_BASE_URL;
    }
  } catch (error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('[env] Failed to read API_BASE_URL hostname, falling back:', sanitizedApiBaseUrl, error);
    }
    sanitizedApiBaseUrl = FALLBACK_API_BASE_URL;
  }
}

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
export const API_URL = sanitizedApiBaseUrl;
export const SOCKET_URL = (() => {
  try {
    const socketUrl = new URL(sanitizedApiBaseUrl);
    socketUrl.protocol = socketUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    return socketUrl.toString().replace(/\/$/, '');
  } catch (_error) {
    return 'wss://api.ai-escrowassistant.com';
  }
})();

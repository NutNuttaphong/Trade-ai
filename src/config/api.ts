const DEFAULT_API_ORIGIN = 'http://localhost:8080';

/** Normalizes `VITE_API_URL` (with or without scheme, trailing slash, or `/api`) into an API origin URL. */
export function normalizeApiOrigin(rawUrl?: string): string {
  const trimmed = rawUrl?.trim();
  if (!trimmed) {
    return DEFAULT_API_ORIGIN;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  return withProtocol.replace(/\/+$/, '').replace(/\/api$/i, '');
}

/** Derives the WebSocket endpoint from the resolved API origin unless `VITE_WS_URL` overrides it. */
export function buildWebSocketUrl(origin: string, explicitWsUrl?: string): string {
  const trimmedWs = explicitWsUrl?.trim();
  if (trimmedWs) {
    return trimmedWs.replace(/\/+$/, '');
  }

  const wsOrigin = origin.replace(/^http/i, 'ws');
  return `${wsOrigin}/ws/stocks`;
}

const API_ORIGIN = normalizeApiOrigin(import.meta.env.VITE_API_URL);

export const API_BASE_URL = `${API_ORIGIN}/api`;
export const WEBSOCKET_URL = buildWebSocketUrl(API_ORIGIN, import.meta.env.VITE_WS_URL);

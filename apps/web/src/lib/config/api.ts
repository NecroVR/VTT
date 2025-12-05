// Determine if we're in browser and get the current origin
const isBrowser = typeof window !== 'undefined';

// In production (Docker), use relative URLs that nginx will proxy
// In development, use the Vite proxy (also relative URLs work)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function getWebSocketUrl(): string {
  if (!isBrowser) return '';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

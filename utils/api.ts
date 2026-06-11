/** CampusLink API client — points to Cloudflare Worker (Neon backend). */

export const API_BASE =
  import.meta.env.VITE_API_URL || 'http://localhost:8787';

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}

export function apiHeaders(extra?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = {};
  const secret = import.meta.env.VITE_API_SECRET;
  if (secret) {
    headers.Authorization = `Bearer ${secret}`;
  }
  if (extra) {
    Object.assign(headers, extra as Record<string, string>);
  }
  return headers;
}

export function apiJsonHeaders(): HeadersInit {
  return apiHeaders({ 'Content-Type': 'application/json' });
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), {
    ...init,
    headers: apiHeaders(init?.headers),
  });
}

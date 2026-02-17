const API_BASE = '/api';

let sessionToken = localStorage.getItem('koth_token') || '';

export function setSessionToken(token: string) {
  sessionToken = token;
  localStorage.setItem('koth_token', token);
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('content-type', 'application/json');
  if (sessionToken) headers.set('authorization', `Bearer ${sessionToken}`);
  if (options.method === 'POST') headers.set('x-idempotency-key', crypto.randomUUID());
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
  return res.json();
}

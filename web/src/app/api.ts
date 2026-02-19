const API_BASE = '/api';

let sessionToken = localStorage.getItem('koth_token') || '';

export function setSessionToken(token: string) {
  sessionToken = token;
  localStorage.setItem('koth_token', token);
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  const traceId = crypto.randomUUID();
  const requestStartedAt = performance.now();

  headers.set('content-type', 'application/json');
  if (sessionToken) headers.set('authorization', `Bearer ${sessionToken}`);
  headers.set('x-trace-id', traceId);
  if (options.method === 'POST') headers.set('x-idempotency-key', crypto.randomUUID());

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const responseReceivedAt = performance.now();

  const serverTotalMs = Number(res.headers.get('x-server-total-ms') || '0');
  const dbTotalMs = Number(res.headers.get('x-db-total-ms') || '0');
  const dbOps = Number(res.headers.get('x-db-ops') || '0');
  const responseTraceId = res.headers.get('x-trace-id') || traceId;
  const frontTotalMs = responseReceivedAt - requestStartedAt;

  const telemetry = {
    traceId: responseTraceId,
    path,
    method: options.method || 'GET',
    front_total_ms: Math.round(frontTotalMs),
    server_total_ms: Math.round(serverTotalMs),
    db_total_ms: Math.round(dbTotalMs),
    db_ops: dbOps,
    network_plus_edge_ms: Math.round(frontTotalMs - serverTotalMs)
  };

  console.info('[api-trace]', telemetry);

  const sentry = (window as typeof window & { Sentry?: { addBreadcrumb: (arg: unknown) => void } }).Sentry;
  if (sentry?.addBreadcrumb) {
    sentry.addBreadcrumb({
      category: 'api.trace',
      level: 'info',
      message: `${telemetry.method} ${path}`,
      data: telemetry
    });
  }

  if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
  return res.json();
}

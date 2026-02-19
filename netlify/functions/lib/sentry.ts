import type { Handler } from '@netlify/functions';
import * as Sentry from '@sentry/node';
import { randomUUID } from 'node:crypto';
import { json } from './http';
import { withRequestTrace, type RequestTrace } from './request-trace';

let initialized = false;

function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (initialized || !dsn) return;
  Sentry.init({ dsn, tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || '0') });
  initialized = true;
}

function recordSlowRequestInSentry(trace: RequestTrace) {
  if (!trace || !process.env.SENTRY_DSN) return;

  const totalMs = Date.now() - trace.startedAtMs;
  const slowThresholdMs = Number(process.env.SLOW_REQUEST_THRESHOLD_MS || '1200');
  if (totalMs < slowThresholdMs) return;

  Sentry.withScope((scope) => {
    scope.setLevel('warning');
    scope.setTag('trace_id', trace.traceId);
    scope.setExtra('path', trace.path);
    scope.setExtra('http_method', trace.method);
    scope.setExtra('server_total_ms', totalMs);
    scope.setExtra('db_total_ms', trace.dbMs);
    scope.setExtra('db_ops', trace.dbOps);
    Sentry.captureMessage('Slow Netlify function request');
  });
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (!process.env.SENTRY_DSN) return;
  initSentry();
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => scope.setExtra(key, value));
    }
    Sentry.captureException(error);
  });
}

export function withSentry(handler: Handler): Handler {
  return async (event, context) => {
    const traceId = event.headers['x-trace-id'] || randomUUID();
    const traceStartedAt = Date.now();
    const requestTrace: RequestTrace = {
      traceId,
      path: event.path,
      method: event.httpMethod,
      startedAtMs: traceStartedAt,
      dbMs: 0,
      dbOps: 0
    };

    try {
      initSentry();
      const response = await withRequestTrace(requestTrace, () => handler(event, context));

      const serverTotalMs = Date.now() - traceStartedAt;
      const dbMs = requestTrace.dbMs;
      const dbOps = requestTrace.dbOps;

      recordSlowRequestInSentry(requestTrace);

      return {
        ...response,
        headers: {
          ...response.headers,
          'x-trace-id': traceId,
          'x-server-total-ms': String(serverTotalMs),
          'x-db-total-ms': String(dbMs),
          'x-db-ops': String(dbOps),
          'server-timing': `app;dur=${serverTotalMs}, db;dur=${dbMs}`
        }
      };
    } catch (error) {
      captureException(error, {
        path: event.path,
        http_method: event.httpMethod,
        function_name: context.functionName,
        trace_id: traceId
      });
      return json(500, { error: 'Internal server error' });
    }
  };
}

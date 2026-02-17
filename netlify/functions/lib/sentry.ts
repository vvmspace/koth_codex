import type { Handler } from '@netlify/functions';
import * as Sentry from '@sentry/node';
import { json } from './http';

let initialized = false;

function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (initialized || !dsn) return;
  Sentry.init({ dsn, tracesSampleRate: 0 });
  initialized = true;
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
    try {
      initSentry();
      return await handler(event, context);
    } catch (error) {
      captureException(error, {
        path: event.path,
        http_method: event.httpMethod,
        function_name: context.functionName
      });
      return json(500, { error: 'Internal server error' });
    }
  };
}

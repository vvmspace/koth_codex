import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestTrace = {
  traceId: string;
  path: string;
  method: string;
  startedAtMs: number;
  dbMs: number;
  dbOps: number;
};

const traceStorage = new AsyncLocalStorage<RequestTrace>();

export function withRequestTrace<T>(trace: RequestTrace, fn: () => Promise<T>): Promise<T> {
  return traceStorage.run(trace, fn);
}

export function getRequestTrace() {
  return traceStorage.getStore();
}

export function trackDbDuration(durationMs: number) {
  const trace = getRequestTrace();
  if (!trace) return;
  trace.dbMs += durationMs;
  trace.dbOps += 1;
}


import type { HandlerResponse } from '@netlify/functions';

export const json = (statusCode: number, body: unknown): HandlerResponse => ({
  statusCode,
  headers: {
    'content-type': 'application/json'
  },
  body: JSON.stringify(body)
});

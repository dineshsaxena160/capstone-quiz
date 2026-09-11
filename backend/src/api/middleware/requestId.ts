import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    requestId: string;
  }
}

const requestIdPattern = /^[A-Za-z0-9_-]{1,80}$/;

export const requestIdMiddleware: RequestHandler = (request, response, next) => {
  const supplied = request.header('X-Request-Id');
  const requestId = supplied && requestIdPattern.test(supplied) ? supplied : randomUUID();
  request.requestId = requestId;
  response.setHeader('X-Request-Id', requestId);
  next();
};

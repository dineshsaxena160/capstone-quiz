import type { ErrorRequestHandler } from 'express';
import { OperationalError, serializeError, statusForError } from '../errors.js';

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  const normalizedError = isRequestBodyError(error)
    ? new OperationalError('invalid_request', { status: 400, retryable: false, cause: error })
    : error;
  const status = statusForError(normalizedError);
  response.status(status).json(serializeError(normalizedError, request.requestId));
};

function isRequestBodyError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('type' in error)) return false;
  return error.type === 'entity.parse.failed' || error.type === 'entity.too.large';
}
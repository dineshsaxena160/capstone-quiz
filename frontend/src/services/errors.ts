import type { ErrorCode, SafeErrorEnvelope } from '@quiz/contracts';

export interface AppError {
  code: ErrorCode;
  message: string;
  retryable: boolean;
  requestId?: string;
}

const fallbackError: AppError = {
  code: 'unknown',
  message: 'Something went wrong while creating the quiz. Please try again.',
  retryable: true,
};

export class ClientRequestError extends Error {
  public readonly appError: AppError;

  constructor(appError: AppError) {
    super(appError.message);
    this.name = 'ClientRequestError';
    this.appError = appError;
  }
}

export function appErrorFromEnvelope(value: unknown): AppError {
  if (!isSafeErrorEnvelope(value)) return fallbackError;
  return value.error.requestId
    ? { ...value.error, requestId: value.error.requestId }
    : {
        code: value.error.code,
        message: value.error.message,
        retryable: value.error.retryable,
      };
}

export function mapTransportError(error: unknown): AppError {
  if (error instanceof ClientRequestError) return error.appError;
  if (error instanceof DOMException && error.name === 'AbortError') {
    return { code: 'timeout', message: 'Creating the quiz took too long. Please try again.', retryable: true };
  }
  if (error instanceof TypeError) {
    return { code: 'network', message: 'The quiz service could not be reached. Please try again.', retryable: true };
  }
  return fallbackError;
}

function isSafeErrorEnvelope(value: unknown): value is SafeErrorEnvelope {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false;
  const candidate = value.error;
  if (typeof candidate !== 'object' || candidate === null) return false;
  const record = candidate as Record<string, unknown>;
  return (
    typeof record.code === 'string' &&
    isErrorCode(record.code) &&
    typeof record.message === 'string' &&
    typeof record.retryable === 'boolean' &&
    (record.requestId === undefined || typeof record.requestId === 'string')
  );
}

function isErrorCode(value: string): value is ErrorCode {
  return [
    'configuration',
    'invalid_request',
    'network',
    'timeout',
    'rate_limit',
    'unauthorized',
    'provider',
    'invalid_response',
    'unknown',
  ].includes(value);
}
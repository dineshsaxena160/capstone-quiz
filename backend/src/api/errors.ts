import type { ErrorCode, SafeErrorEnvelope } from '@quiz/contracts';

const safeMessages: Record<ErrorCode, string> = {
  configuration: 'The quiz service is not configured yet. Please try again later.',
  invalid_request: 'Choose one supported topic to start a quiz.',
  network: 'The quiz service could not be reached. Please try again.',
  timeout: 'Creating the quiz took too long. Please try again.',
  rate_limit: 'The quiz service is busy. Please wait a moment and try again.',
  unauthorized: 'The quiz service authorization needs attention. Please try again later.',
  provider: 'The quiz service is temporarily unavailable. Please try again.',
  invalid_response: 'We received an unusable quiz response. Please try again.',
  unknown: 'Something went wrong while creating the quiz. Please try again.',
};

const defaultStatuses: Record<ErrorCode, number> = {
  configuration: 503,
  invalid_request: 400,
  network: 502,
  timeout: 504,
  rate_limit: 429,
  unauthorized: 401,
  provider: 502,
  invalid_response: 502,
  unknown: 500,
};

const defaultRetryable: Record<ErrorCode, boolean> = {
  configuration: false,
  invalid_request: false,
  network: true,
  timeout: true,
  rate_limit: true,
  unauthorized: false,
  provider: true,
  invalid_response: true,
  unknown: true,
};

export class OperationalError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;
  public readonly retryable: boolean;

  constructor(
    code: ErrorCode,
    options: { status?: number; retryable?: boolean; cause?: unknown } = {},
  ) {
    super(safeMessages[code], { cause: options.cause });
    this.name = 'OperationalError';
    this.code = code;
    this.status = options.status ?? defaultStatuses[code];
    this.retryable = options.retryable ?? defaultRetryable[code];
  }
}

export function invalidRequestError(): OperationalError {
  return new OperationalError('invalid_request', { retryable: false });
}

export function serializeError(error: unknown, requestId?: string): SafeErrorEnvelope {
  const operationalError = error instanceof OperationalError ? error : new OperationalError('unknown');
  const safeError = {
    code: operationalError.code,
    message: safeMessages[operationalError.code],
    retryable: operationalError.retryable,
    ...(requestId ? { requestId } : {}),
  } satisfies SafeErrorEnvelope['error'];
  return { error: safeError };
}

export function statusForError(error: unknown): number {
  return error instanceof OperationalError ? error.status : 500;
}

export function providerError(error: unknown): OperationalError {
  const status = readStatus(error);
  if (status === 401 || status === 403) {
    return new OperationalError('unauthorized', { status, retryable: false, cause: error });
  }
  if (status === 408 || status === 504) {
    return new OperationalError('timeout', { status: 504, cause: error });
  }
  if (status === 429) {
    return new OperationalError('rate_limit', { status: 429, cause: error });
  }
  return new OperationalError('provider', { status: 502, cause: error });
}

function readStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('status' in error)) {
    return undefined;
  }
  const status = error.status;
  return typeof status === 'number' ? status : undefined;
}
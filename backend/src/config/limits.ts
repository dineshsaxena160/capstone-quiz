export interface GenerationLimits {
  requestBodyBytes: number;
  routeDeadlineMs: number;
  maxProviderAttempts: number;
  rateLimitWindowMs: number;
  rateLimitMax: number;
  retryBaseDelayMs?: number;
  retryMaxDelayMs?: number;
}

export const DEFAULT_LIMITS: GenerationLimits = {
  requestBodyBytes: 16 * 1024,
  routeDeadlineMs: 45_000,
  maxProviderAttempts: 3,
  rateLimitWindowMs: 60_000,
  rateLimitMax: 12,
  retryBaseDelayMs: 100,
  retryMaxDelayMs: 1_000,
};
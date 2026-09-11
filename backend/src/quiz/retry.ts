export function getRetryDelay(
  attempt: number,
  baseDelayMs = 100,
  maxDelayMs = 1_000,
  random: () => number = Math.random,
): number {
  const exponentialDelay = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
  const jitteredDelay = exponentialDelay * (0.5 + Math.max(0, Math.min(1, random())));
  return Math.min(maxDelayMs, Math.round(jitteredDelay));
}

export function waitForRetry(delayMs: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.reject(new DOMException('The request was aborted.', 'AbortError'));

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, delayMs);
    const abort = () => {
      clearTimeout(timeout);
      signal.removeEventListener('abort', abort);
      reject(new DOMException('The request was aborted.', 'AbortError'));
    };
    signal.addEventListener('abort', abort, { once: true });
  });
}
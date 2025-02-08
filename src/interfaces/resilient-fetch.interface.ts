export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface RetryOptions {
  maxRetries: number;
  delay: number;
  jitterFactor?: number;  // Optional parameter for adding randomized jitter to retry delays
  fetch?: typeof fetch;
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  recoveryTimeout: number;
  fetch?: typeof fetch;
}

export interface TimeoutOptions {
  timeout: number;
  fetch?: typeof fetch;
}

export interface ResilientFetchOptions {
  retry?: RetryOptions;
  circuitBreaker?: CircuitBreakerOptions;
  timeout?: TimeoutOptions;
}

export interface ResilientFetchClient {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

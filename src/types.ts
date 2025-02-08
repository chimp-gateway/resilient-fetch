export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface RetryPolicyOptions {
  maxRetries: number;
  delay: number;
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  recoveryTimeout: number;
}

export interface TimeoutPolicyOptions {
  timeout: number;
}

export interface ResilientFetchOptions {
  retryPolicy?: RetryPolicyOptions;
  circuitBreaker?: CircuitBreakerOptions;
  timeoutPolicy?: TimeoutPolicyOptions;
}

export interface ResilientFetchClient {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

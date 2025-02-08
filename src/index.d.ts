declare module "@chimp-gateway/fetch" {
  export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

  export interface RetryOptions {
    maxRetries: number;
    delay: number;
  }

  export interface CircuitBreakerOptions {
    failureThreshold: number;
    recoveryTimeout: number;
  }

  export interface TimeoutOptions {
    timeout: number;
  }

  export interface ResilientFetchOptions {
    retry?: RetryOptions;
    circuitBreaker?: CircuitBreakerOptions;
    timeout?: TimeoutOptions;
  }

  export interface ResilientFetchClient {
    fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
  }

  export function createFetchClient(
    options?: ResilientFetchOptions
  ): ResilientFetchClient;
}

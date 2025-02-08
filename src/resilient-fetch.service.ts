import type {
  ResilientFetchOptions,
  ResilientFetchClient,
} from "./interfaces/resilient-fetch.interface";
import { RetryPolicy } from "./policies/retry.policy";
import { CircuitBreaker } from "./policies/circuit-breaker.policy";
import { TimeoutPolicy } from "./policies/timeout.policy";

export class ResilientFetchService implements ResilientFetchClient {
  private retryPolicy?: RetryPolicy;
  private circuitBreaker?: CircuitBreaker;
  private timeoutPolicy?: TimeoutPolicy;

  constructor(options: ResilientFetchOptions = {}) {
    if (options.retry) {
      this.retryPolicy = new RetryPolicy(options.retry);
    }
    if (options.circuitBreaker) {
      this.circuitBreaker = new CircuitBreaker(options.circuitBreaker);
    }
    if (options.timeout) {
      this.timeoutPolicy = new TimeoutPolicy(options.timeout);
    }
  }

  async fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let operation = async (): Promise<Response> => {
      return await fetch(input, { ...init });
    };

    if (this.retryPolicy) {
      const retryOperation = operation;
      operation = () => this.retryPolicy!.execute(retryOperation);
    }

    if (this.circuitBreaker) {
      const circuitOperation = operation;
      operation = () => this.circuitBreaker!.execute(circuitOperation);
    }

    if (this.timeoutPolicy) {
      const timeoutOperation = operation;
      operation = () => this.timeoutPolicy!.execute(timeoutOperation);
    }

    return await operation();
  }
}

export function createFetchClient(options?: ResilientFetchOptions): {
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
} {
  const client = new ResilientFetchService(options);
  return {
    fetch: (input: RequestInfo | URL, init?: RequestInit) =>
      client.fetch(input, init),
  };
}

import type { RetryPolicyOptions } from "../interfaces/resilient-fetch.interface";

export class RetryPolicy {
  constructor(private readonly options: RetryPolicyOptions) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let attempts = 0;
    let lastError: Error = new Error("Unknown error");

    while (attempts <= this.options.maxRetries) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempts++;

        if (attempts > this.options.maxRetries) {
          break;
        }

        const backoffDelay = this.options.delay * Math.pow(2, attempts - 1);
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      }
    }

    throw lastError;
  }
}

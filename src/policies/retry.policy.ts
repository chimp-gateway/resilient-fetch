import type { RetryOptions } from "../interfaces/resilient-fetch.interface";

export class RetryPolicy {
  constructor(private readonly options: RetryOptions) {
    this.options.jitterFactor = this.options.jitterFactor ?? 0.1;
  }

  private calculateBackoffWithJitter(attempt: number): number {
    // Calculate base delay: baseDelay = delay * 2^(attempt-1)
    const baseDelay = this.options.delay * Math.pow(2, attempt - 1);
    
    // If no jitter, return exact base delay
    if (this.options.jitterFactor === 0) {
      return baseDelay;
    }
    
    // Calculate maximum jitter as a percentage of base delay
    const maxJitter = baseDelay * this.options.jitterFactor!;
    // Generate random jitter between -maxJitter and +maxJitter
    const jitter = (Math.random() * 2 - 1) * maxJitter;
    
    return Math.max(0, baseDelay + jitter);
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let attempts = 1; // Start at 1 for first attempt
    let lastError: Error = new Error("Unknown error");

    while (attempts <= this.options.maxRetries + 1) { // +1 to account for initial attempt
      try {
        const result = await operation();
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempts > this.options.maxRetries) {
          break;
        }

        attempts++; // Increment attempts after failure, before retry
        const backoffDelay = this.calculateBackoffWithJitter(attempts);
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      }
    }
    throw lastError;
  }
}

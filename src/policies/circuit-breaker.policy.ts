import type {
  CircuitBreakerOptions,
  CircuitState,
} from "../interfaces/resilient-fetch.interface";

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private nextAttempt = 0;

  constructor(private readonly options: CircuitBreakerOptions) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() < this.nextAttempt) {
        throw new Error("Circuit breaker is open");
      }
      this.halfOpenCircuit();
    }

    try {
      const result = await operation();
      if (this.state === "HALF_OPEN") {
        this.closeCircuit();
      }
      return result;
    } catch (error) {
      this.failureCount++;
      if (this.failureCount >= this.options.failureThreshold) {
        this.openCircuit();
      }
      throw error;
    }
  }

  private openCircuit(): void {
    this.state = "OPEN";
    this.nextAttempt = Date.now() + this.options.recoveryTimeout;
  }

  private closeCircuit(): void {
    this.state = "CLOSED";
    this.failureCount = 0;
  }

  private halfOpenCircuit(): void {
    this.state = "HALF_OPEN";
  }
}

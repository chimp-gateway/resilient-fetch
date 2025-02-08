import { describe, expect, test, mock } from "bun:test";
import { CircuitBreaker } from "../src/policies/circuit-breaker.policy";

describe("CircuitBreaker", () => {
  test("should allow successful operations", async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 2,
      recoveryTimeout: 1000,
    });

    const operation = mock(() => Promise.resolve("success"));
    const result = await breaker.execute(operation);
    expect(result).toBe("success");
  });

  test("should open circuit after failures", async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 2,
      recoveryTimeout: 1000,
    });

    const operation = mock(() => Promise.reject(new Error("Service error")));

    // First failure
    await expect(breaker.execute(operation)).rejects.toThrow("Service error");
    // Second failure opens the circuit
    await expect(breaker.execute(operation)).rejects.toThrow("Service error");
    // Circuit is now open
    await expect(breaker.execute(operation)).rejects.toThrow(
      "Circuit breaker is open"
    );
  });

  test("should transition to half-open after timeout", async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 2,
      recoveryTimeout: 100,
    });

    let shouldFail = true;
    const operation = mock(() => {
      if (shouldFail) {
        return Promise.reject(new Error("Service error"));
      }
      return Promise.resolve("success");
    });

    // Open the circuit
    await expect(breaker.execute(operation)).rejects.toThrow();
    await expect(breaker.execute(operation)).rejects.toThrow();

    // Wait for recovery timeout
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Should work now
    shouldFail = false;
    const result = await breaker.execute(operation);
    expect(result).toBe("success");
  });
});

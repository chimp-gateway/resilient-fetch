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
      recoveryTimeout: 100,
    });

    const operation = mock(() => Promise.reject(new Error("Service error")));

    // First failure
    await expect(breaker.execute(operation)).rejects.toThrow("Service error");
    // Second failure opens the circuit
    await expect(breaker.execute(operation)).rejects.toThrow("Service error");
    // Circuit is now open
    await expect(breaker.execute(operation)).rejects.toThrow("Circuit breaker is open");
  });

  test("should transition to half-open after recovery timeout", async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 2,
      recoveryTimeout: 0, // Immediate recovery for testing
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

    // Should work now
    shouldFail = false;
    const result = await breaker.execute(operation);
    expect(result).toBe("success");
  });

  test("should maintain failure count across requests", async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 3,
      recoveryTimeout: 100,
    });

    const operation = mock(() => Promise.reject(new Error("Service error")));

    // First two failures shouldn't open circuit
    await expect(breaker.execute(operation)).rejects.toThrow("Service error");
    await expect(breaker.execute(operation)).rejects.toThrow("Service error");
    
    // Third failure should open circuit
    await expect(breaker.execute(operation)).rejects.toThrow("Service error");
    // Circuit should now be open
    await expect(breaker.execute(operation)).rejects.toThrow("Circuit breaker is open");
  });

  test("should reset failure count after successful execution", async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 2,
      recoveryTimeout: 0, // Immediate recovery for testing
    });

    let shouldFail = true;
    const operation = mock(() => {
      if (shouldFail) {
        return Promise.reject(new Error("Service error"));
      }
      return Promise.resolve("success");
    });

    // First failure
    await expect(breaker.execute(operation)).rejects.toThrow("Service error");
    
    // Second request succeeds and should reset the failure count
    shouldFail = false;
    const result = await breaker.execute(operation);
    expect(result).toBe("success");

    // Next attempt should start with a fresh failure count
    shouldFail = true;
    await expect(breaker.execute(operation)).rejects.toThrow("Service error");
    
    // Still not enough failures to open circuit
    shouldFail = false;
    const result2 = await breaker.execute(operation);
    expect(result2).toBe("success");
  });

  test("should handle half-open state failures", async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 2,
      recoveryTimeout: 10, // Immediate recovery for testing
    });

    let attempts = 0;
    const operation = mock(() => {
      attempts++;
      return Promise.reject(new Error("Service error"));
    });

    // Open the circuit
    expect(breaker.execute(operation)).rejects.toThrow();
    expect(breaker.execute(operation)).rejects.toThrow();
    // Failure in half-open state should immediately open circuit
    expect(breaker.execute(operation)).rejects.toThrow();
    // Circuit should be open again
    expect(breaker.execute(operation)).rejects.toThrow("Circuit breaker is open");
  });

  test("should preserve error details", async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 2,
      recoveryTimeout: 100,
    });

    class CustomError extends Error {
      constructor(public readonly code: string, message: string) {
        super(message);
        this.name = "CustomError";
      }
    }

    const operation = mock(() => 
      Promise.reject(new CustomError("ERR_001", "Custom service error"))
    );

    try {
      await breaker.execute(operation);
    } catch (error) {
      expect(error).toBeInstanceOf(CustomError);
      expect((error as CustomError).code).toBe("ERR_001");
      expect((error as CustomError).message).toBe("Custom service error");
    }
  });
});

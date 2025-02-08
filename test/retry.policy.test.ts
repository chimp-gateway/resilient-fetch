import { describe, expect, test, mock } from "bun:test";
import { RetryPolicy } from "../src/policies/retry.policy";

describe("RetryPolicy", () => {
  test("should retry failed operations", async () => {
    const policy = new RetryPolicy({ maxRetries: 2, delay: 100 });
    let attempts = 0;

    const operation = mock(() => {
      attempts++;
      if (attempts <= 2) {
        return Promise.reject(new Error("Temporary failure"));
      }
      return Promise.resolve("success");
    });

    const result = await policy.execute(operation);
    expect(result).toBe("success");
    expect(attempts).toBe(3); // Initial attempt + 2 retries = 3
  });

  test("should throw after max retries", async () => {
    const policy = new RetryPolicy({ maxRetries: 2, delay: 100 });
    let attempts = 0;

    const operation = mock(() => {
      attempts++;
      return Promise.reject(new Error("Persistent failure"));
    });

    await expect(policy.execute(operation)).rejects.toThrow("Persistent failure");
    expect(attempts).toBe(3); // Initial attempt + 2 retries
  });

  test("should handle zero jitter factor", async () => {
    const policy = new RetryPolicy({ maxRetries: 2, delay: 100, jitterFactor: 0 });
    let attempts = 0;
    
    const operation = mock(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.reject(new Error("Retry needed"));
      }
      return Promise.resolve("success");
    });

    const result = await policy.execute(operation);
    expect(result).toBe("success");
    expect(attempts).toBe(3);
  });

  test("should handle successful first attempt", async () => {
    const policy = new RetryPolicy({ maxRetries: 2, delay: 100, jitterFactor: 0.1 });
    const operation = mock(() => Promise.resolve("immediate success"));

    const result = await policy.execute(operation);
    expect(result).toBe("immediate success");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  test("should preserve error types during retries", async () => {
    const policy = new RetryPolicy({ maxRetries: 1, delay: 100 });
    
    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'CustomError';
      }
    }

    const operation = mock(() => Promise.reject(new CustomError("Custom error message")));

    try {
      await policy.execute(operation);
      expect(false).toBe(true); // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(CustomError);
      expect((error as CustomError).message).toBe("Custom error message");
    }
  });
});

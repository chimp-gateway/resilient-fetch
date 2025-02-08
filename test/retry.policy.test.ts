import { describe, expect, test, mock } from "bun:test";
import { RetryPolicy } from "../src/policies/retry.policy";

describe("RetryPolicy", () => {
  test("should retry failed operations", async () => {
    const policy = new RetryPolicy({ maxRetries: 2, delay: 100 });
    let attempts = 0;

    const operation = mock(() => {
      attempts++;
      if (attempts < 2) {
        throw new Error("Temporary failure");
      }
      return Promise.resolve("success");
    });

    const result = await policy.execute(operation);
    expect(result).toBe("success");
    expect(attempts).toBe(2);
  });

  test("should throw after max retries", async () => {
    const policy = new RetryPolicy({ maxRetries: 2, delay: 100 });
    let attempts = 0;

    const operation = mock(() => {
      attempts++;
      throw new Error("Persistent failure");
    });

    await expect(policy.execute(operation)).rejects.toThrow(
      "Persistent failure"
    );
    expect(attempts).toBe(3); // Initial attempt + 2 retries
  });
});

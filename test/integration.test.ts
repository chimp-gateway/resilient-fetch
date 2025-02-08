import { describe, expect, test, mock } from "bun:test";
import { createFetchClient } from "../src";

describe("Integration", () => {
  test("should handle all policies together", async () => {
    const { fetch } = createFetchClient({
      retry: { maxRetries: 2, delay: 100 },
      circuitBreaker: { failureThreshold: 3, recoveryTimeout: 1000 },
      timeout: { timeout: 500 },
    });

    let attempts = 0;
    global.fetch = mock(() => {
      attempts++;
      if (attempts < 2) {
        return Promise.reject(new Error("Temporary failure"));
      }
      return Promise.resolve(new Response("ok"));
    }) as typeof global.fetch;

    const response = await fetch("https://api.example.com");
    const text = await response.text();

    expect(text).toBe("ok");
    expect(attempts).toBe(2);
  });
});

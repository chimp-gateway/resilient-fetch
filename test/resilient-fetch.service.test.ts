import { describe, expect, test, mock } from "bun:test";
import { createFetchClient } from "../src";

describe("ResilientFetchService", () => {
  test("should make successful request", async () => {
    const { fetch } = createFetchClient();
    const mockResponse = new Response("ok");
    global.fetch = mock(() =>
      Promise.resolve(mockResponse)
    ) as typeof global.fetch;

    const response = await fetch("https://api.example.com");
    expect(response).toBe(mockResponse);
  });

  test("should handle timeout", async () => {
    const { fetch } = createFetchClient({
      timeout: { timeout: 100 },
    });

    global.fetch = mock(
      () =>
        new Promise((_, reject) => {
          setTimeout(() => {
            const error = new DOMException("Request timed out", "AbortError");
            reject(error);
          }, 200);
        })
    ) as typeof global.fetch;

    const promise = fetch("https://api.example.com");
    await expect(promise).rejects.toThrow("Request timed out");
  });
});

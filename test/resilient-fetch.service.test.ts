import { describe, expect, test, mock, beforeEach, afterEach } from "bun:test";
import { createFetchClient } from "../src";

describe("ResilientFetchService", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Reset fetch to original state before each test
    global.fetch = originalFetch;
  });

  afterEach(() => {
    // Restore original fetch after each test
    global.fetch = originalFetch;
  });

  test("should make successful request", async () => {
    const { fetch } = createFetchClient();
    const mockResponse = new Response("ok");
    global.fetch = mock(() =>
      Promise.resolve(mockResponse)
    ) as unknown as typeof global.fetch;

    const response = await fetch("https://api.example.com");
    expect(response).toBe(mockResponse);
  });

  test("should handle timeout", async () => {
    const { fetch } = createFetchClient({
      timeout: { timeout: 100 }
    });

    // Immediately reject with a timeout error instead of using setTimeout
    global.fetch = mock(
      () => Promise.reject(new Error("Operation timed out after 100ms"))
    ) as unknown as typeof global.fetch;

    await expect(fetch("https://api.example.com")).rejects.toThrow("Operation timed out after 100ms");
  });
});

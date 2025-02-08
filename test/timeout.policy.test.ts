import { describe, expect, test, mock } from "bun:test";
import { TimeoutPolicy } from "../src/policies/timeout.policy";

describe("TimeoutPolicy", () => {
  test("should handle successful operation within timeout", async () => {
    const policy = new TimeoutPolicy({ timeout: 1000 });
    const operation = mock(() => Promise.resolve("success"));

    const result = await policy.execute(operation);
    expect(result).toBe("success");
  });

  test("should timeout on long operations", async () => {
    const policy = new TimeoutPolicy({ timeout: 100 });
    const operation = mock(() => new Promise((resolve) => setTimeout(() => resolve("late"), 200)));

    await expect(policy.execute(operation)).rejects.toThrow("Operation timed out after 100ms");
  });

  test("should handle fetch operations", async () => {
    const policy = new TimeoutPolicy({ timeout: 1000 });
    const mockRequest = new Request("https://example.com");
    const mockResponse = new Response("ok");
    
    global.fetch = mock(() => Promise.resolve(mockResponse));
    
    const operation = mock(() => Promise.resolve(mockRequest));
    
    const result = await policy.execute(operation);
    expect(result).toBe(mockRequest);
  });

test("should handle fetch operation timeouts", async () => {
    const policy = new TimeoutPolicy({
        timeout: 100,
        fetch: mock(() => {
            return new Promise<Response>((resolve) => 
                setTimeout(() => resolve(new Response("late")), 100)
            )
        }) as unknown as typeof fetch
    });

    const operation = mock(() => Promise.resolve(new Request("https://example.com")));
    operation.toString = () => "function fetch() { [native code] }";

    expect(policy.execute(operation)).rejects.toThrow(
        "Operation timed out after 100ms"
    );
});

  test("should handle non-timeout errors in fetch operations", async () => {
    const policy = new TimeoutPolicy({
        timeout: 100,
        fetch: mock(() => Promise.reject(new Error("Network error"))) as unknown as typeof fetch
    });
    
    const operation = mock(() => Promise.resolve(new Request("https://example.com")));
    operation.toString = () => "function fetch() { [native code] }";
    
    expect(policy.execute(operation)).rejects.toThrow("Network error");
  });
});
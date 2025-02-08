import type { TimeoutOptions } from "../interfaces/resilient-fetch.interface";

export class TimeoutPolicy {
  private readonly timeoutMs: number;

  constructor(options: TimeoutOptions) {
    this.timeoutMs = options.timeout;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      if (operation.toString().includes("fetch")) {
        const fetchOp = operation as () => Promise<Request>;
        const request = await fetchOp();
        return fetch(request.url, {
          ...request,
          signal: controller.signal,
        }) as Promise<T>;
      }
      return await operation();
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "name" in error &&
        error.name === "AbortError"
      ) {
        throw new Error("Request timed out");
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

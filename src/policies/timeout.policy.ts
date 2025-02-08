import type { TimeoutOptions } from "../interfaces/resilient-fetch.interface";

export class TimeoutPolicy {
  private readonly timeoutMs: number;
  private readonly fetch: typeof fetch;

  constructor(options: TimeoutOptions) {
    this.timeoutMs = options.timeout;
    this.fetch = options.fetch ?? fetch;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error(`Operation timed out after ${this.timeoutMs}ms`));
      }, this.timeoutMs);

      try {
        if (operation.toString().includes("fetch")) {
          const fetchOp = operation as () => Promise<Request>;
          const request = await fetchOp();
          
          const response = await this.fetch(request.url, {
            ...request,
            signal: controller.signal,
          });
          
          resolve(response as unknown as T);
        } else {
          const result = await operation();
          resolve(result);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          reject(new Error(`Operation timed out after ${this.timeoutMs}ms`));
        } else {
          reject(error);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    });
  }
}

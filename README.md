# @chimp-gateway/fetch

A TypeScript-first HTTP client with built-in resilience patterns including retry, circuit breaker, and timeout. Drop-in replacement for the native fetch API.

## Why @chimp-gateway/fetch?

- 🔄 **Drop-in Replacement**: Uses the same API as native `fetch`
- 🛡️ **Built-in Resilience**: Retry, circuit breaker, and timeout patterns
- 📦 **Zero Dependencies**: Lightweight and efficient
- 🔍 **Type Safe**: Written in TypeScript with full type support
- 🪶 **Minimal Learning Curve**: If you know `fetch`, you know `@chimp-gateway/fetch`

## Installation

```bash
npm install @chimp-gateway/fetch
# or
yarn add @chimp-gateway/fetch
# or
bun add @chimp-gateway/fetch
```

## Basic Usage

```typescript
import { createFetchClient } from "@chimp-gateway/fetch";

const { fetch } = createFetchClient({
  retry: {
    maxRetries: 3,
    delay: 1000, // base delay in ms
  },
  circuitBreaker: {
    failureThreshold: 5,
    recoveryTimeout: 30000, // 30 seconds
  },
  timeout: {
    timeout: 5000, // 5 seconds
  },
});

// Use exactly like the native fetch API
try {
  const response = await fetch("https://api.example.com/data");
  const data = await response.json();
} catch (error) {
  console.error("Request failed:", error);
}
```

## Resilience Patterns

### Retry

Automatically retries failed requests with exponential backoff and optional jitter.

```typescript
const { fetch } = createFetchClient({
  retry: {
    maxRetries: 3, // maximum number of retries
    delay: 1000, // initial delay between retries (ms)
    jitterFactor: 0.1 // adds randomized delay variation (optional, defaults to 0.1)
  },
});
```

The retry policy implements exponential backoff with jitter to prevent thundering herd problems. The delay between retries increases exponentially, and a random jitter is added to spread out retry attempts.

### Circuit Breaker

Prevents cascading failures by stopping requests when the system is under stress. The circuit breaker has three states:

- CLOSED: Normal operation, requests are allowed through
- OPEN: After reaching failure threshold, stops all requests
- HALF-OPEN: After recovery timeout, allows one test request to check if service has recovered

```typescript
const { fetch } = createFetchClient({
  circuitBreaker: {
    failureThreshold: 5, // number of failures before opening
    recoveryTimeout: 30000, // time until retry (ms)
  },
});
```

When in OPEN state, all requests immediately fail with a "Circuit breaker is open" error. After the recoveryTimeout period, the circuit goes into HALF-OPEN state and allows one request through. If this request succeeds, the circuit returns to CLOSED state; if it fails, the circuit opens again.

### Timeout

Cancels requests that take too long to respond. Has special handling for fetch operations to properly abort them using AbortController.

```typescript
const { fetch } = createFetchClient({
  timeout: {
    timeout: 5000, // maximum wait time (ms)
  },
});
```

If a request exceeds the timeout, it will be aborted and throw an error with the message "Operation timed out after {timeout}ms". For fetch operations, this properly cancels the underlying network request.

## Combining Patterns

You can combine multiple patterns for enhanced resilience:

```typescript
const { fetch } = createFetchClient({
  retry: {
    maxRetries: 3,
    delay: 1000,
  },
  circuitBreaker: {
    failureThreshold: 5,
    recoveryTimeout: 30000,
  },
  timeout: {
    timeout: 5000,
  },
});
```

## Pattern Execution Order

Patterns are applied in the following order:

1. Circuit Breaker (failure prevention)
2. Timeout (time limiting)
3. Retry (attempts)

## Types

The library is fully typed and exports all necessary interfaces:

```typescript
import type {
  ResilientFetchOptions,
  RetryOptions,
  CircuitBreakerOptions,
  TimeoutOptions,
  CircuitState,
} from "@chimp-gateway/fetch";
```

## Error Handling

The library uses standard fetch Response and Error objects, with additional context for pattern-specific failures:

```typescript
try {
  const response = await fetch("https://api.example.com/data");
} catch (error) {
  if (error.message.includes("Circuit breaker is open")) {
    // Handle circuit breaker error
  } else if (error.message.includes("Operation timed out after")) {
    // Handle timeout error
  } else {
    // Handle other errors
  }
}
```

## Direct Fetch Replacement

You can directly replace the global fetch with the resilient version:

```typescript
const { fetch } = createFetchClient({
  retry: { maxRetries: 3 },
});

// Replace global fetch
globalThis.fetch = fetch;

// Now all fetch calls are resilient
const response = await fetch("https://api.example.com/data");
```

## Contributing

Contributions are welcome! Please open an issue to discuss proposed changes.

## License

MIT

## Inspired by

- [Failsafe](https://failsafe-go.dev/)
- [Polly](https://github.com/App-vNext/Polly)

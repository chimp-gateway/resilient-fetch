# @resilient/fetch

A TypeScript-first HTTP client with built-in resilience patterns including retry, circuit breaker, and timeout. Drop-in replacement for the native fetch API.

## Why @resilient/fetch?

- 🔄 **Drop-in Replacement**: Uses the same API as native `fetch`
- 🛡️ **Built-in Resilience**: Retry, circuit breaker, and timeout patterns
- 📦 **Zero Dependencies**: Lightweight and efficient
- 🔍 **Type Safe**: Written in TypeScript with full type support
- 🪶 **Minimal Learning Curve**: If you know `fetch`, you know `@resilient/fetch`

## Installation

```bash
npm install @resilient/fetch
# or
yarn add @resilient/fetch
# or
bun add @resilient/fetch
```

## Basic Usage

```typescript
import { createFetchClient } from "@resilient/fetch";

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

Automatically retries failed requests with exponential backoff.

```typescript
const { fetch } = createFetchClient({
  retry: {
    maxRetries: 3, // maximum number of retries
    delay: 1000, // initial delay between retries (ms)
  },
});
```

### Circuit Breaker

Prevents cascading failures by stopping requests when the system is under stress.

```typescript
const { fetch } = createFetchClient({
  circuitBreaker: {
    failureThreshold: 5, // number of failures before opening
    recoveryTimeout: 30000, // time until retry (ms)
  },
});
```

### Timeout

Cancels requests that take too long to respond.

```typescript
const { fetch } = createFetchClient({
  timeout: {
    timeout: 5000, // maximum wait time (ms)
  },
});
```

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

1. Retry (attempts)
2. Circuit Breaker (failure prevention)
3. Timeout (time limiting)

## Types

The library is fully typed and exports all necessary interfaces:

```typescript
import type {
  ResilientFetchOptions,
  RetryOptions,
  CircuitBreakerOptions,
  TimeoutOptions,
} from "@resilient/fetch";
```

## Error Handling

The library uses standard fetch Response and Error objects, with additional context for pattern-specific failures:

```typescript
try {
  const response = await fetch("https://api.example.com/data");
} catch (error) {
  if (error.message === "Circuit breaker is open") {
    // Handle circuit breaker error
  } else if (error.message === "Request timed out") {
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

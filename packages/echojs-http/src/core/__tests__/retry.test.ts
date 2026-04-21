import { describe, it, expect } from "vitest";
import {
  isRetryableStatus,
  isRetryableErrorCode,
  isRetryableError,
  isRetryableHttpError,
  shouldRetryAttempt,
  defaultCalculateDelay,
} from "../retry.js";
import { HTTPStatusError } from "../../errors/http-status-error.js";
import { NetworkError } from "../../errors/network-error.js";
import { TimeoutError } from "../../errors/timeout-error.js";
import type { NormalizedRequestOptions } from "../../types/internal.js";

describe("isRetryableStatus", () => {
  it("should return false when allowed is undefined", () => {
    expect(isRetryableStatus(500, undefined)).toBe(false);
  });

  it("should return true when status is in allowed list", () => {
    expect(isRetryableStatus(500, [500, 502, 503])).toBe(true);
  });

  it("should return false when status is not in allowed list", () => {
    expect(isRetryableStatus(200, [500, 502])).toBe(false);
  });

  it("should handle empty allowed list", () => {
    expect(isRetryableStatus(500, [])).toBe(false);
  });

  it("should handle single status in allowed list", () => {
    expect(isRetryableStatus(429, [429])).toBe(true);
  });
});

describe("isRetryableErrorCode", () => {
  it("should return false when code is undefined", () => {
    expect(isRetryableErrorCode(undefined, ["ECONNRESET"])).toBe(false);
  });

  it("should return false when allowed is undefined", () => {
    expect(isRetryableErrorCode("ECONNRESET", undefined)).toBe(false);
  });

  it("should return true when code is in allowed list", () => {
    expect(isRetryableErrorCode("ECONNRESET", ["ECONNRESET", "ETIMEDOUT"])).toBe(true);
  });

  it("should return false when code is not in allowed list", () => {
    expect(isRetryableErrorCode("ENOTFOUND", ["ECONNRESET", "ETIMEDOUT"])).toBe(false);
  });
});

describe("isRetryableError", () => {
  it("should return true for NetworkError", () => {
    const error = new NetworkError("Network failed");
    expect(isRetryableError(error, [])).toBe(true);
  });

  it("should return true for TimeoutError", () => {
    const error = new TimeoutError("Timeout", { phase: "request" });
    expect(isRetryableError(error, [])).toBe(true);
  });

  it("should return true when error has matching code", () => {
    const error = { code: "ECONNRESET" };
    expect(isRetryableError(error, ["ECONNRESET"])).toBe(true);
  });

  it("should return false when error has non-matching code", () => {
    const error = { code: "ENOTFOUND" };
    expect(isRetryableError(error, ["ECONNRESET"])).toBe(false);
  });

  it("should return false for plain Error", () => {
    const error = new Error("Some error");
    expect(isRetryableError(error, ["ECONNRESET"])).toBe(false);
  });

  it("should return false for error without code", () => {
    const error = { message: "Some error" };
    expect(isRetryableError(error, ["ECONNRESET"])).toBe(false);
  });

  it("should return false for null", () => {
    expect(isRetryableError(null, ["ECONNRESET"])).toBe(false);
  });
});

describe("isRetryableHttpError", () => {
  it("should return false for non-HTTPStatusError", () => {
    const error = new Error("Some error");
    expect(isRetryableHttpError(error, [500])).toBe(false);
  });

  it("should return true for HTTPStatusError with retryable status", () => {
    const mockResponse = { status: 503 } as any;
    const error = new HTTPStatusError("Service unavailable", { response: mockResponse });
    expect(isRetryableHttpError(error, [500, 502, 503])).toBe(true);
  });

  it("should return false for HTTPStatusError with non-retryable status", () => {
    const mockResponse = { status: 400 } as any;
    const error = new HTTPStatusError("Bad request", { response: mockResponse });
    expect(isRetryableHttpError(error, [500, 502, 503])).toBe(false);
  });
});

describe("shouldRetryAttempt", () => {
  const createNormalized = (overrides: Partial<NormalizedRequestOptions["retry"] & { method: string }> = {}): NormalizedRequestOptions => ({
    method: overrides.method || "GET",
    retry: {
      limit: 3,
      methods: ["GET", "POST"],
      statusCodes: [500, 502, 503],
      errorCodes: ["ECONNRESET"],
      calculateDelay: undefined,
      ...overrides,
    },
  } as NormalizedRequestOptions);

  it("should return false when retry limit is 0", () => {
    const normalized = createNormalized({ limit: 0 });
    const error = new Error("Some error");
    expect(shouldRetryAttempt({ error, normalized })).toBe(false);
  });

  it("should return false when method is not in allowed methods", () => {
    const normalized = createNormalized({ method: "DELETE", methods: ["GET", "POST"] });
    const error = new Error("Some error");
    expect(shouldRetryAttempt({ error, normalized })).toBe(false);
  });

  it("should return true for retryable HTTP status", () => {
    const mockResponse = { status: 503 } as any;
    const normalized = createNormalized();
    expect(shouldRetryAttempt({ error: null, normalized, response: mockResponse })).toBe(true);
  });

  it("should return false for non-retryable HTTP status", () => {
    const mockResponse = { status: 400 } as any;
    const normalized = createNormalized();
    expect(shouldRetryAttempt({ error: null, normalized, response: mockResponse })).toBe(false);
  });

  it("should return true for HTTPStatusError with retryable status", () => {
    const mockResponse = { status: 500 } as any;
    const error = new HTTPStatusError("Error", { response: mockResponse });
    const normalized = createNormalized();
    expect(shouldRetryAttempt({ error, normalized })).toBe(true);
  });

  it("should return true for NetworkError", () => {
    const error = new NetworkError("Network failed");
    const normalized = createNormalized();
    expect(shouldRetryAttempt({ error, normalized })).toBe(true);
  });

  it("should return true for TimeoutError", () => {
    const error = new TimeoutError("Timeout", { phase: "request" });
    const normalized = createNormalized();
    expect(shouldRetryAttempt({ error, normalized })).toBe(true);
  });

  it("should return true for error with matching error code", () => {
    const error = { code: "ECONNRESET" };
    const normalized = createNormalized();
    expect(shouldRetryAttempt({ error, normalized })).toBe(true);
  });

  it("should return false for non-retryable error", () => {
    const error = new Error("Some error");
    const normalized = createNormalized();
    expect(shouldRetryAttempt({ error, normalized })).toBe(false);
  });
});

describe("defaultCalculateDelay", () => {
  it("should calculate base delay for first attempt", () => {
    const ctx = { attempt: 1, retryCount: 0, error: new Error(), request: {} as any };
    const delay = defaultCalculateDelay(ctx);
    expect(delay).toBeGreaterThanOrEqual(250);
    expect(delay).toBeLessThanOrEqual(350); // base + max jitter
  });

  it("should calculate exponential backoff", () => {
    const ctx1 = { attempt: 1, retryCount: 0, error: new Error(), request: {} as any };
    const ctx2 = { attempt: 2, retryCount: 1, error: new Error(), request: {} as any };
    const ctx3 = { attempt: 3, retryCount: 2, error: new Error(), request: {} as any };

    const delay1 = defaultCalculateDelay(ctx1);
    const delay2 = defaultCalculateDelay(ctx2);
    const delay3 = defaultCalculateDelay(ctx3);

    expect(delay2).toBeGreaterThan(delay1);
    expect(delay3).toBeGreaterThan(delay2);
  });

  it("should cap at maximum delay", () => {
    const ctx = { attempt: 100, retryCount: 99, error: new Error(), request: {} as any };
    const delay = defaultCalculateDelay(ctx);
    expect(delay).toBeLessThanOrEqual(10100); // max (10000) + max jitter (100)
  });

  it("should add jitter to delay", () => {
    const delays: number[] = [];
    const ctx = { attempt: 1, retryCount: 0, error: new Error(), request: {} as any };

    for (let i = 0; i < 10; i++) {
      delays.push(defaultCalculateDelay(ctx));
    }

    // With jitter, not all delays should be the same
    const uniqueDelays = new Set(delays);
    expect(uniqueDelays.size).toBeGreaterThan(1);
  });

  it("should respect minimum base delay", () => {
    const ctx = { attempt: 1, retryCount: 0, error: new Error(), request: {} as any };
    const delay = defaultCalculateDelay(ctx);
    expect(delay).toBeGreaterThanOrEqual(250);
  });
});

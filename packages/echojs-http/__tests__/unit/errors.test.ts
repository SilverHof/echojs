import { describe, expect, it } from "vitest";
import {
  AbortError,
  HTTPStatusError,
  HttpClientError,
  isAbortError,
  isHttpError,
  isNetworkError,
  isStatusError,
  isTimeoutError,
  NetworkError,
  ParseError,
  RedirectError,
  RequestError,
  RetryError,
  TimeoutError,
} from "../../src/errors/index.js";

describe("error model", () => {
  it("supports instanceof checks", () => {
    expect(new RequestError("x") instanceof HttpClientError).toBe(true);
    expect(new NetworkError("x") instanceof HttpClientError).toBe(true);
    expect(new TimeoutError("x", { phase: "read" }) instanceof HttpClientError).toBe(true);
    expect(new AbortError() instanceof HttpClientError).toBe(true);
    expect(new ParseError("x") instanceof HttpClientError).toBe(true);
    expect(new RetryError("x", { lastError: new Error("y") }) instanceof HttpClientError).toBe(true);
    expect(new RedirectError("x", { redirectCount: 3 }) instanceof HttpClientError).toBe(true);
  });

  it("provides type guards", () => {
    const e: unknown = new TimeoutError("x", { phase: "read" });
    expect(isHttpError(e)).toBe(true);
    expect(isTimeoutError(e)).toBe(true);
    expect(isAbortError(e)).toBe(false);
    expect(isNetworkError(e)).toBe(false);
    expect(isStatusError(e)).toBe(false);
  });
});

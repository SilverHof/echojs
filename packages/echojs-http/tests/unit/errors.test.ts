import { describe, expect, it } from "vitest";
import {
  AbortError,
  HTTPStatusError,
  HttpClientError,
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
});

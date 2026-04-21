import { describe, it, expect } from "vitest";
import { HttpClientError } from "../http-client-error.js";
import { TimeoutError } from "../timeout-error.js";
import { AbortError } from "../abort-error.js";
import { NetworkError } from "../network-error.js";
import { HTTPStatusError } from "../http-status-error.js";
import { RequestError } from "../request-error.js";
import { ParseError } from "../parse-error.js";
import { RetryError } from "../retry-error.js";
import { RedirectError } from "../redirect-error.js";
import type { NormalizedRequestOptions } from "../../types/internal.js";
import type { HttpResponse } from "../../types/response.js";
import type { HttpTimings } from "../../types/timings.js";

describe("HttpClientError", () => {
  it("should create error with message", () => {
    const error = new HttpClientError("test message", { code: "ERR_HTTP_CLIENT" });
    expect(error.message).toBe("test message");
    expect(error.name).toBe("HttpClientError");
  });

  it("should have correct code", () => {
    const error = new HttpClientError("test", { code: "ERR_HTTP_CLIENT" });
    expect(error.code).toBe("ERR_HTTP_CLIENT");
  });

  it("should store cause", () => {
    const cause = new Error("original");
    const error = new HttpClientError("wrapped", { code: "ERR_HTTP_CLIENT", cause });
    expect(error.cause).toBe(cause);
  });

  it("should store request", () => {
    const request = { url: "https://example.com" } as NormalizedRequestOptions;
    const error = new HttpClientError("test", { code: "ERR_HTTP_CLIENT", request });
    expect(error.request).toBe(request);
  });

  it("should store response", () => {
    const response = { status: 500 } as HttpResponse<unknown>;
    const error = new HttpClientError("test", { code: "ERR_HTTP_CLIENT", response });
    expect(error.response).toBe(response);
  });

  it("should store timings", () => {
    const timings: HttpTimings = { request: 100, response: 200 };
    const error = new HttpClientError("test", { code: "ERR_HTTP_CLIENT", timings });
    expect(error.timings).toBe(timings);
  });

  it("should default retryCount to 0", () => {
    const error = new HttpClientError("test", { code: "ERR_HTTP_CLIENT" });
    expect(error.retryCount).toBe(0);
  });

  it("should store custom retryCount", () => {
    const error = new HttpClientError("test", { code: "ERR_HTTP_CLIENT", retryCount: 3 });
    expect(error.retryCount).toBe(3);
  });

  it("should freeze context", () => {
    const error = new HttpClientError("test", { code: "ERR_HTTP_CLIENT", context: { key: "value" } });
    expect(Object.isFrozen(error.context)).toBe(true);
  });

  it("should store requestId", () => {
    const error = new HttpClientError("test", { code: "ERR_HTTP_CLIENT", requestId: "abc-123" });
    expect(error.requestId).toBe("abc-123");
  });

  it("should derive method from request", () => {
    const request = { method: "POST" } as NormalizedRequestOptions;
    const error = new HttpClientError("test", { code: "ERR_HTTP_CLIENT", request });
    expect(error.method).toBe("POST");
  });

  it("should use provided method over request method", () => {
    const request = { method: "POST" } as NormalizedRequestOptions;
    const error = new HttpClientError("test", { code: "ERR_HTTP_CLIENT", request, method: "GET" });
    expect(error.method).toBe("GET");
  });

  it("should derive url from request", () => {
    const request = { url: "https://example.com" } as NormalizedRequestOptions;
    const error = new HttpClientError("test", { code: "ERR_HTTP_CLIENT", request });
    expect(error.url).toBe("https://example.com");
  });

  it("should derive status from response", () => {
    const response = { status: 404 } as HttpResponse<unknown>;
    const error = new HttpClientError("test", { code: "ERR_HTTP_CLIENT", response });
    expect(error.status).toBe(404);
  });

  it("should freeze headers", () => {
    const headers = { "x-custom": "value" };
    const error = new HttpClientError("test", { code: "ERR_HTTP_CLIENT", headers });
    expect(Object.isFrozen(error.headers)).toBe(true);
  });

  it("should store responseBodyPreview", () => {
    const error = new HttpClientError("test", {
      code: "ERR_HTTP_CLIENT",
      responseBodyPreview: '{"error":"message"}',
    });
    expect(error.responseBodyPreview).toBe('{"error":"message"}');
  });
});

describe("TimeoutError", () => {
  it("should have correct code", () => {
    const error = new TimeoutError("timeout", { phase: "request" });
    expect(error.code).toBe("ERR_TIMEOUT");
    expect(error.name).toBe("TimeoutError");
  });

  it("should store phase", () => {
    const error = new TimeoutError("timeout", { phase: "request" });
    expect(error.phase).toBe("request");
  });

  it("should support all phases", () => {
    expect(new TimeoutError("", { phase: "request" }).phase).toBe("request");
    expect(new TimeoutError("", { phase: "response" }).phase).toBe("response");
    expect(new TimeoutError("", { phase: "read" }).phase).toBe("read");
  });
});

describe("AbortError", () => {
  it("should have correct code", () => {
    const error = new AbortError("aborted");
    expect(error.code).toBe("ERR_ABORT");
    expect(error.name).toBe("AbortError");
  });

  it("should have default message", () => {
    const error = new AbortError();
    expect(error.message).toBe("Request aborted");
  });

  it("should accept custom message", () => {
    const error = new AbortError("User cancelled");
    expect(error.message).toBe("User cancelled");
  });
});

describe("NetworkError", () => {
  it("should have correct code", () => {
    const error = new NetworkError("network failed");
    expect(error.code).toBe("ERR_NETWORK");
    expect(error.name).toBe("NetworkError");
  });
});

describe("HTTPStatusError", () => {
  it("should have correct code", () => {
    const response = { status: 500 } as HttpResponse<unknown>;
    const error = new HTTPStatusError("error", { response });
    expect(error.code).toBe("ERR_HTTP_STATUS");
    expect(error.name).toBe("HTTPStatusError");
  });

  it("should store response", () => {
    const response = { status: 404, body: "Not found" } as HttpResponse<unknown>;
    const error = new HTTPStatusError("error", { response });
    expect(error.response).toBe(response);
  });
});

describe("RequestError", () => {
  it("should have correct code", () => {
    const error = new RequestError("invalid options");
    expect(error.code).toBe("ERR_REQUEST");
    expect(error.name).toBe("RequestError");
  });
});

describe("ParseError", () => {
  it("should have correct code", () => {
    const error = new ParseError("parse failed");
    expect(error.code).toBe("ERR_PARSE");
    expect(error.name).toBe("ParseError");
  });

  it("should store response", () => {
    const response = { status: 200 } as HttpResponse<unknown>;
    const error = new ParseError("parse failed", { response });
    expect(error.response).toBe(response);
  });
});

describe("RetryError", () => {
  it("should have correct code", () => {
    const error = new RetryError("exhausted", { lastError: new Error() });
    expect(error.code).toBe("ERR_RETRY");
    expect(error.name).toBe("RetryError");
  });

  it("should store lastError", () => {
    const lastError = new Error("last attempt");
    const error = new RetryError("exhausted", { lastError });
    expect(error.lastError).toBe(lastError);
  });

  it("should use lastError as cause by default", () => {
    const lastError = new Error("last attempt");
    const error = new RetryError("exhausted", { lastError });
    expect(error.cause).toBe(lastError);
  });

  it("should prefer explicit cause over lastError", () => {
    const lastError = new Error("last attempt");
    const explicitCause = new Error("explicit");
    const error = new RetryError("exhausted", { lastError, cause: explicitCause });
    expect(error.cause).toBe(explicitCause);
  });
});

describe("RedirectError", () => {
  it("should have correct code", () => {
    const error = new RedirectError("too many", { redirectCount: 5 });
    expect(error.code).toBe("ERR_REDIRECT");
    expect(error.name).toBe("RedirectError");
  });

  it("should store redirectCount", () => {
    const error = new RedirectError("too many", { redirectCount: 10 });
    expect(error.redirectCount).toBe(10);
  });

  it("should store lastLocation", () => {
    const error = new RedirectError("too many", { redirectCount: 5, lastLocation: "https://example.com" });
    expect(error.lastLocation).toBe("https://example.com");
  });

  it("should handle undefined lastLocation", () => {
    const error = new RedirectError("too many", { redirectCount: 5 });
    expect(error.lastLocation).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";
import { HTTPStatusError } from "../../src/errors/http-status-error.js";
import { NetworkError } from "../../src/errors/network-error.js";
import { normalizeRequestOptions } from "../../src/options/normalize.js";
import { HttpResponseImpl } from "../../src/core/response.js";
import { shouldRetryAttempt } from "../../src/core/retry.js";

function minimalNormalized(overrides: Partial<ReturnType<typeof normalizeRequestOptions>> = {}) {
  const base = normalizeRequestOptions({ url: "https://example.test/", method: "GET" });
  return { ...base, ...overrides };
}

describe("shouldRetryAttempt", () => {
  it("is conservative when limit is 0", () => {
    const n = minimalNormalized({ retry: { ...minimalNormalized().retry, limit: 0 } });
    expect(shouldRetryAttempt({ error: new NetworkError("x"), normalized: n })).toBe(false);
  });

  it("retries network errors when enabled", () => {
    const n = minimalNormalized({ retry: { ...minimalNormalized().retry, limit: 2 } });
    expect(shouldRetryAttempt({ error: new NetworkError("x"), normalized: n })).toBe(true);
  });

  it("respects retryable status codes", () => {
    const n = minimalNormalized({
      method: "GET",
      retry: { ...minimalNormalized().retry, limit: 2, statusCodes: [503] },
    });
    const res = new HttpResponseImpl({
      url: n.url,
      status: 503,
      statusText: "Service Unavailable",
      ok: false,
      headers: { "content-type": "text/plain" },
      body: undefined,
      bodyState: { kind: "none" },
      request: n,
      retryCount: 0,
    });
    const err = new HTTPStatusError("x", { response: res });
    expect(shouldRetryAttempt({ error: err, normalized: n, response: res })).toBe(true);
  });

  it("does not retry non-idempotent methods by default when methods list excludes them", () => {
    const n = minimalNormalized({
      method: "POST",
      retry: { ...minimalNormalized().retry, limit: 2, methods: ["GET", "HEAD", "OPTIONS"] },
    });
    expect(shouldRetryAttempt({ error: new NetworkError("x"), normalized: n })).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import {
  isRedirectStatus,
  resolveRedirectLocation,
  stripSensitiveHeadersForRedirect,
  applyRedirectPolicy,
  assertSameOriginIfNeeded,
} from "../redirect.js";
import type { NormalizedRequestOptions } from "../../types/internal.js";

describe("isRedirectStatus", () => {
  it("should return true for redirect status codes", () => {
    expect(isRedirectStatus(301)).toBe(true);
    expect(isRedirectStatus(302)).toBe(true);
    expect(isRedirectStatus(303)).toBe(true);
    expect(isRedirectStatus(307)).toBe(true);
    expect(isRedirectStatus(308)).toBe(true);
  });

  it("should return false for non-redirect status codes", () => {
    expect(isRedirectStatus(200)).toBe(false);
    expect(isRedirectStatus(201)).toBe(false);
    expect(isRedirectStatus(400)).toBe(false);
    expect(isRedirectStatus(404)).toBe(false);
    expect(isRedirectStatus(500)).toBe(false);
  });

  it("should return false for legacy redirect codes", () => {
    expect(isRedirectStatus(300)).toBe(false);
    expect(isRedirectStatus(304)).toBe(false);
  });
});

describe("resolveRedirectLocation", () => {
  it("should resolve absolute URL", () => {
    const result = resolveRedirectLocation("https://example.com/path", "https://other.com/new");
    expect(result).toBe("https://other.com/new");
  });

  it("should resolve relative URL", () => {
    const result = resolveRedirectLocation("https://example.com/path", "/new/path");
    expect(result).toBe("https://example.com/new/path");
  });

  it("should resolve relative URL without leading slash", () => {
    const result = resolveRedirectLocation("https://example.com/path/", "new/path");
    expect(result).toBe("https://example.com/path/new/path");
  });

  it("should resolve URL with query string", () => {
    const result = resolveRedirectLocation("https://example.com", "/path?key=value");
    expect(result).toBe("https://example.com/path?key=value");
  });

  it("should throw when location is null", () => {
    expect(() => resolveRedirectLocation("https://example.com", null)).toThrow("Redirect response missing Location header");
  });

  it("should throw when location is empty string", () => {
    expect(() => resolveRedirectLocation("https://example.com", "")).toThrow("Redirect response missing Location header");
  });

  it("should resolve protocol-relative URL", () => {
    const result = resolveRedirectLocation("https://example.com", "//other.com/path");
    expect(result).toBe("https://other.com/path");
  });
});

describe("stripSensitiveHeadersForRedirect", () => {
  const sensitiveHeaders = {
    authorization: "Bearer token",
    cookie: "session=abc",
    "proxy-authorization": "Basic abc",
    "set-cookie": "session=abc",
  };

  const nonSensitiveHeaders = {
    "content-type": "application/json",
    accept: "application/json",
    "x-custom": "value",
  };

  it("should return headers unchanged when not enabled", () => {
    const headers = { ...sensitiveHeaders };
    const result = stripSensitiveHeadersForRedirect(headers, "https://a.com", "https://b.com", false);
    expect(result).toEqual(headers);
  });

  it("should strip sensitive headers for cross-origin redirect when enabled", () => {
    const headers = { ...sensitiveHeaders, ...nonSensitiveHeaders };
    const result = stripSensitiveHeadersForRedirect(headers, "https://a.com", "https://b.com", true);
    expect(result).not.toHaveProperty("authorization");
    expect(result).not.toHaveProperty("cookie");
    expect(result).not.toHaveProperty("proxy-authorization");
    expect(result).not.toHaveProperty("set-cookie");
    expect(result).toHaveProperty("content-type");
    expect(result).toHaveProperty("accept");
  });

  it("should not strip headers for same-origin redirect", () => {
    const headers = { ...sensitiveHeaders };
    const result = stripSensitiveHeadersForRedirect(headers, "https://example.com/path", "https://example.com/other", true);
    expect(result).toEqual(headers);
  });

  it("should strip headers when protocol differs", () => {
    const headers = { ...sensitiveHeaders };
    const result = stripSensitiveHeadersForRedirect(headers, "http://example.com", "https://example.com", true);
    // Different protocol means different origin
    expect(result).not.toHaveProperty("authorization");
  });

  it("should strip headers when port differs", () => {
    const headers = { ...sensitiveHeaders };
    const result = stripSensitiveHeadersForRedirect(headers, "https://example.com:8080", "https://example.com:9090", true);
    expect(result).not.toHaveProperty("authorization");
  });

  it("should handle invalid URLs gracefully", () => {
    const headers = { authorization: "Bearer token" };
    const result = stripSensitiveHeadersForRedirect(headers, "not-a-url", "also-not-a-url", true);
    // When URLs are invalid, returns copy of headers
    expect(result).toEqual(headers);
  });

  it("should create new object, not modify original", () => {
    const headers = { authorization: "Bearer token", "content-type": "json" };
    const result = stripSensitiveHeadersForRedirect(headers, "https://a.com", "https://b.com", true);
    expect(result).not.toBe(headers);
    expect(headers).toHaveProperty("authorization");
  });
});

describe("applyRedirectPolicy", () => {
  const createRequest = (overrides: Partial<NormalizedRequestOptions> = {}): NormalizedRequestOptions => ({
    method: "POST",
    url: "https://example.com/path",
    headers: { "content-type": "application/json" },
    body: { kind: "json", data: "{}", contentType: "application/json" },
    redirect: { follow: true, max: 10, keepMethod: false, strictOrigin: false, stripSensitiveHeaders: true },
    ...overrides,
  } as NormalizedRequestOptions);

  it("should change method to GET for 303 status", () => {
    const from = createRequest({ method: "POST" });
    const result = applyRedirectPolicy({ status: 303, from, toUrl: "https://example.com/new" });
    expect(result.method).toBe("GET");
  });

  it("should remove body for 303 status", () => {
    const from = createRequest({ method: "POST", body: { kind: "json", data: "{}", contentType: "application/json" } });
    const result = applyRedirectPolicy({ status: 303, from, toUrl: "https://example.com/new" });
    expect(result.body).toEqual({ kind: "none" });
  });

  it("should change method to GET for 301/302 when not keepMethod and original was not GET/HEAD", () => {
    const from = createRequest({ method: "POST", redirect: { ...createRequest().redirect, keepMethod: false } });
    const result301 = applyRedirectPolicy({ status: 301, from, toUrl: "https://example.com/new" });
    const result302 = applyRedirectPolicy({ status: 302, from, toUrl: "https://example.com/new" });
    expect(result301.method).toBe("GET");
    expect(result302.method).toBe("GET");
  });

  it("should keep method for 301/302 when keepMethod is true", () => {
    const from = createRequest({ method: "POST", redirect: { ...createRequest().redirect, keepMethod: true } });
    const result = applyRedirectPolicy({ status: 301, from, toUrl: "https://example.com/new" });
    expect(result.method).toBe("POST");
  });

  it("should keep method for GET requests on 301/302", () => {
    const from = createRequest({ method: "GET" });
    const result = applyRedirectPolicy({ status: 301, from, toUrl: "https://example.com/new" });
    expect(result.method).toBe("GET");
  });

  it("should keep method for HEAD requests on 301/302", () => {
    const from = createRequest({ method: "HEAD" });
    const result = applyRedirectPolicy({ status: 301, from, toUrl: "https://example.com/new" });
    expect(result.method).toBe("HEAD");
  });

  it("should keep method for 307/308 regardless of keepMethod", () => {
    const from = createRequest({ method: "POST", redirect: { ...createRequest().redirect, keepMethod: false } });
    const result307 = applyRedirectPolicy({ status: 307, from, toUrl: "https://example.com/new" });
    const result308 = applyRedirectPolicy({ status: 308, from, toUrl: "https://example.com/new" });
    expect(result307.method).toBe("POST");
    expect(result308.method).toBe("POST");
  });

  it("should update URL", () => {
    const from = createRequest();
    const result = applyRedirectPolicy({ status: 302, from, toUrl: "https://other.com/new-path" });
    expect(result.url).toBe("https://other.com/new-path");
  });

  it("should strip sensitive headers for cross-origin redirect", () => {
    const from = createRequest({
      headers: { authorization: "Bearer token", "content-type": "application/json" },
    });
    const result = applyRedirectPolicy({ status: 302, from, toUrl: "https://other.com/new" });
    expect(result.headers).not.toHaveProperty("authorization");
    expect(result.headers).toHaveProperty("content-type");
  });
});

describe("assertSameOriginIfNeeded", () => {
  it("should not throw when strict is false", () => {
    expect(() => assertSameOriginIfNeeded("https://a.com", "https://b.com", false)).not.toThrow();
  });

  it("should not throw when origins are the same", () => {
    expect(() => assertSameOriginIfNeeded("https://example.com/path", "https://example.com/other", true)).not.toThrow();
  });

  it("should throw when origins are different and strict is true", () => {
    expect(() => assertSameOriginIfNeeded("https://a.com", "https://b.com", true)).toThrow("Cross-origin redirect blocked by redirect.strictOrigin");
  });

  it("should throw when protocols are different", () => {
    expect(() => assertSameOriginIfNeeded("http://example.com", "https://example.com", true)).toThrow("Cross-origin redirect blocked by redirect.strictOrigin");
  });

  it("should throw when ports are different", () => {
    expect(() => assertSameOriginIfNeeded("https://example.com:8080", "https://example.com:9090", true)).toThrow("Cross-origin redirect blocked by redirect.strictOrigin");
  });
});

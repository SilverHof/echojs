import { describe, it, expect, vi } from "vitest";
import { normalizeRequestOptions, mergeAndNormalize } from "../normalize.js";
import type { RequestOptions } from "../../types/public.js";

describe("normalizeRequestOptions", () => {
  it("should normalize method to uppercase", () => {
    const options: RequestOptions = { method: "get", url: "https://example.com" };
    const result = normalizeRequestOptions(options);
    expect(result.method).toBe("GET");
  });

  it("should default method to GET", () => {
    const options: RequestOptions = { url: "https://example.com" };
    const result = normalizeRequestOptions(options);
    expect(result.method).toBe("GET");
  });

  it("should build URL correctly", () => {
    const options: RequestOptions = { url: "https://example.com/path" };
    const result = normalizeRequestOptions(options);
    expect(result.url).toBe("https://example.com/path");
  });

  it("should build URL with baseUrl", () => {
    const options: RequestOptions = { baseUrl: "https://api.example.com", url: "/path" };
    const result = normalizeRequestOptions(options);
    expect(result.url).toBe("https://api.example.com/path");
  });

  it("should build URL with baseUrl ending with slash", () => {
    const options: RequestOptions = { baseUrl: "https://api.example.com/", url: "path" };
    const result = normalizeRequestOptions(options);
    expect(result.url).toBe("https://api.example.com/path");
  });

  it("should apply searchParams", () => {
    const options: RequestOptions = { url: "https://example.com", searchParams: { key: "value" } };
    const result = normalizeRequestOptions(options);
    expect(result.url).toBe("https://example.com/?key=value");
    expect(result.searchParamsApplied).toBe(true);
  });

  it("should normalize headers to lowercase", () => {
    const options: RequestOptions = {
      url: "https://example.com",
      headers: { "X-Custom": "value", "Authorization": "Bearer token" },
    };
    const result = normalizeRequestOptions(options);
    expect(result.headers).toHaveProperty("x-custom");
    expect(result.headers).toHaveProperty("authorization");
  });

  it("should set content-type for json body", () => {
    const options: RequestOptions = { url: "https://example.com", json: { key: "value" } };
    const result = normalizeRequestOptions(options);
    expect(result.headers["content-type"]).toBe("application/json; charset=utf-8");
  });

  it("should set content-type for form body", () => {
    const options: RequestOptions = { url: "https://example.com", form: { key: "value" } };
    const result = normalizeRequestOptions(options);
    expect(result.headers["content-type"]).toBe("application/x-www-form-urlencoded");
  });

  it("should not override user-provided content-type", () => {
    const options: RequestOptions = {
      url: "https://example.com",
      json: { key: "value" },
      headers: { "content-type": "application/vnd.api+json" },
    };
    const result = normalizeRequestOptions(options);
    expect(result.headers["content-type"]).toBe("application/vnd.api+json");
  });

  it("should normalize retry methods to uppercase", () => {
    const options: RequestOptions = {
      url: "https://example.com",
      retry: { methods: ["get", "post" as any] },
    };
    const result = normalizeRequestOptions(options);
    expect(result.retry.methods).toEqual(["GET", "POST"]);
  });

  it("should set default retry values", () => {
    const options: RequestOptions = { url: "https://example.com" };
    const result = normalizeRequestOptions(options);
    expect(result.retry.limit).toBe(0);
    expect(result.retry.methods).toEqual(["GET", "HEAD", "OPTIONS"]);
    expect(result.retry.statusCodes).toEqual([408, 413, 429, 500, 502, 503, 504]);
    expect(result.retry.errorCodes).toEqual(["ECONNRESET", "EPIPE", "ETIMEDOUT", "UND_ERR_CONNECT_TIMEOUT"]);
    expect(result.retry.calculateDelay).toBeUndefined();
  });

  it("should use custom retry values when provided", () => {
    const customDelay = vi.fn(() => 100);
    const options: RequestOptions = {
      url: "https://example.com",
      retry: {
        limit: 5,
        methods: ["POST"],
        statusCodes: [500],
        errorCodes: ["ECONNRESET"],
        calculateDelay: customDelay,
      },
    };
    const result = normalizeRequestOptions(options);
    expect(result.retry.limit).toBe(5);
    expect(result.retry.methods).toEqual(["POST"]);
    expect(result.retry.statusCodes).toEqual([500]);
    expect(result.retry.errorCodes).toEqual(["ECONNRESET"]);
    expect(result.retry.calculateDelay).toBe(customDelay);
  });

  it("should set default redirect values", () => {
    const options: RequestOptions = { url: "https://example.com" };
    const result = normalizeRequestOptions(options);
    expect(result.redirect.follow).toBe(true);
    expect(result.redirect.max).toBe(10);
    expect(result.redirect.keepMethod).toBe(false);
    expect(result.redirect.strictOrigin).toBe(false);
    expect(result.redirect.stripSensitiveHeaders).toBe(true);
  });

  it("should use custom redirect values when provided", () => {
    const options: RequestOptions = {
      url: "https://example.com",
      redirect: {
        follow: false,
        max: 5,
        keepMethod: true,
        strictOrigin: true,
        stripSensitiveHeaders: false,
      },
    };
    const result = normalizeRequestOptions(options);
    expect(result.redirect.follow).toBe(false);
    expect(result.redirect.max).toBe(5);
    expect(result.redirect.keepMethod).toBe(true);
    expect(result.redirect.strictOrigin).toBe(true);
    expect(result.redirect.stripSensitiveHeaders).toBe(false);
  });

  it("should set default responseType to bytes", () => {
    const options: RequestOptions = { url: "https://example.com" };
    const result = normalizeRequestOptions(options);
    expect(result.responseType).toBe("bytes");
  });

  it("should use custom responseType when provided", () => {
    const options: RequestOptions = { url: "https://example.com", responseType: "json" };
    const result = normalizeRequestOptions(options);
    expect(result.responseType).toBe("json");
  });

  it("should set default decompress to true", () => {
    const options: RequestOptions = { url: "https://example.com" };
    const result = normalizeRequestOptions(options);
    expect(result.decompress).toBe(true);
  });

  it("should set default throwHttpErrors to true", () => {
    const options: RequestOptions = { url: "https://example.com" };
    const result = normalizeRequestOptions(options);
    expect(result.throwHttpErrors).toBe(true);
  });

  it("should preserve AbortSignal", () => {
    const controller = new AbortController();
    const options: RequestOptions = { url: "https://example.com", signal: controller.signal };
    const result = normalizeRequestOptions(options);
    expect(result.signal).toBe(controller.signal);
  });

  it("should set default tracing values", () => {
    const options: RequestOptions = { url: "https://example.com" };
    const result = normalizeRequestOptions(options);
    expect(result.tracing.errorBodyPreviewBytes).toBe(1024);
    expect(result.tracing.requestIdHeader).toBeUndefined();
    expect(result.tracing.generateRequestId).toBeUndefined();
  });

  it("should use custom tracing values when provided", () => {
    const customGenerator = () => "custom-id";
    const options: RequestOptions = {
      url: "https://example.com",
      tracing: {
        requestIdHeader: "x-request-id",
        generateRequestId: customGenerator,
        errorBodyPreviewBytes: 2048,
      },
    };
    const result = normalizeRequestOptions(options);
    expect(result.tracing.requestIdHeader).toBe("x-request-id");
    expect(result.tracing.generateRequestId).toBe(customGenerator);
    expect(result.tracing.errorBodyPreviewBytes).toBe(2048);
  });

  it("should copy context", () => {
    const options: RequestOptions = { url: "https://example.com", context: { key: "value" } };
    const result = normalizeRequestOptions(options);
    expect(result.context).toEqual({ key: "value" });
  });

  it("should preserve adapter", () => {
    const customAdapter = { name: "custom", supports: {} as any, execute: async () => ({}) as any };
    const options: RequestOptions = { url: "https://example.com", adapter: customAdapter };
    const result = normalizeRequestOptions(options);
    expect(result.adapter).toBe(customAdapter);
  });

  it("should set baseUrl as string", () => {
    const options: RequestOptions = { url: "https://example.com", baseUrl: "https://api.example.com" };
    const result = normalizeRequestOptions(options);
    expect(result.baseUrl).toBe("https://api.example.com");
  });

  it("should convert URL baseUrl to string", () => {
    const options: RequestOptions = { url: "https://example.com", baseUrl: new URL("https://api.example.com") };
    const result = normalizeRequestOptions(options);
    expect(result.baseUrl).toBe("https://api.example.com/");
  });

  it("should preserve hooks with correct shape", () => {
    const hook = () => {};
    const options: RequestOptions = {
      url: "https://example.com",
      hooks: {
        init: [],
        beforeRequest: [hook],
        beforeRedirect: [],
        beforeRetry: [],
        afterResponse: [],
        beforeError: [],
      },
    };
    const result = normalizeRequestOptions(options);
    expect(result.hooks.beforeRequest).toHaveLength(1);
    expect(result.hooks.beforeRequest[0]).toBe(hook);
  });

  it("should use EMPTY_HOOKS when no hooks provided", () => {
    const options: RequestOptions = { url: "https://example.com" };
    const result = normalizeRequestOptions(options);
    expect(result.hooks.init).toHaveLength(0);
    expect(result.hooks.beforeRequest).toHaveLength(0);
    expect(result.hooks.beforeRedirect).toHaveLength(0);
    expect(result.hooks.beforeRetry).toHaveLength(0);
    expect(result.hooks.afterResponse).toHaveLength(0);
    expect(result.hooks.beforeError).toHaveLength(0);
  });
});

describe("mergeAndNormalize", () => {
  it("should merge parent and child options before normalizing", () => {
    const parent: RequestOptions = { method: "GET", baseUrl: "https://api.example.com" };
    const child: RequestOptions = { url: "/path" };
    const result = mergeAndNormalize(parent, child);
    expect(result.method).toBe("GET");
    expect(result.url).toBe("https://api.example.com/path");
  });

  it("should override parent values with child values", () => {
    const parent: RequestOptions = { url: "https://example.com", method: "GET", responseType: "text" };
    const child: RequestOptions = { url: "https://example.com", method: "post", responseType: "json" };
    const result = mergeAndNormalize(parent, child);
    expect(result.method).toBe("POST");
    expect(result.responseType).toBe("json");
  });
});

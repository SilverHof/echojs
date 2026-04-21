import { describe, it, expect } from "vitest";
import { toUrlString, appendSearchParams, buildUrl } from "../url.js";
import type { SearchParamsInitLike } from "../../types/public.js";

describe("toUrlString", () => {
  it("should return undefined for undefined input", () => {
    expect(toUrlString(undefined)).toBeUndefined();
  });

  it("should return string as-is", () => {
    expect(toUrlString("https://example.com")).toBe("https://example.com");
  });

  it("should convert URL to string", () => {
    const url = new URL("https://example.com/path");
    expect(toUrlString(url)).toBe("https://example.com/path");
  });
});

describe("appendSearchParams", () => {
  it("should not modify URL when searchParams is undefined", () => {
    const url = new URL("https://example.com/path");
    appendSearchParams(url, undefined);
    expect(url.search).toBe("");
  });

  it("should append string search params", () => {
    const url = new URL("https://example.com/path");
    appendSearchParams(url, "key1=value1&key2=value2");
    expect(url.searchParams.get("key1")).toBe("value1");
    expect(url.searchParams.get("key2")).toBe("value2");
  });

  it("should append URLSearchParams", () => {
    const url = new URL("https://example.com/path");
    const params = new URLSearchParams({ key: "value" });
    appendSearchParams(url, params);
    expect(url.searchParams.get("key")).toBe("value");
  });

  it("should append array of tuples", () => {
    const url = new URL("https://example.com/path");
    appendSearchParams(url, [["key1", "value1"], ["key2", "value2"]]);
    expect(url.searchParams.get("key1")).toBe("value1");
    expect(url.searchParams.get("key2")).toBe("value2");
  });

  it("should append record object", () => {
    const url = new URL("https://example.com/path");
    const params: SearchParamsInitLike = { key1: "value1", key2: "value2" };
    appendSearchParams(url, params);
    expect(url.searchParams.get("key1")).toBe("value1");
    expect(url.searchParams.get("key2")).toBe("value2");
  });

  it("should skip undefined and null values in record", () => {
    const url = new URL("https://example.com/path");
    const params: SearchParamsInitLike = {
      valid: "value",
      undefinedKey: undefined,
      nullKey: null,
    };
    appendSearchParams(url, params);
    expect(url.searchParams.get("valid")).toBe("value");
    expect(url.searchParams.has("undefinedKey")).toBe(false);
    expect(url.searchParams.has("nullKey")).toBe(false);
  });

  it("should convert values to strings", () => {
    const url = new URL("https://example.com/path");
    const params: SearchParamsInitLike = {
      string: "value",
      number: 42,
      boolean: true,
    };
    appendSearchParams(url, params);
    expect(url.searchParams.get("string")).toBe("value");
    expect(url.searchParams.get("number")).toBe("42");
    expect(url.searchParams.get("boolean")).toBe("true");
  });

  it("should append to existing search params", () => {
    const url = new URL("https://example.com/path?existing=value");
    appendSearchParams(url, { key: "new" });
    expect(url.searchParams.get("existing")).toBe("value");
    expect(url.searchParams.get("key")).toBe("new");
  });

  it("should append multiple values for same key", () => {
    const url = new URL("https://example.com/path");
    appendSearchParams(url, [["key", "value1"], ["key", "value2"]]);
    expect(url.searchParams.getAll("key")).toEqual(["value1", "value2"]);
  });
});

describe("buildUrl", () => {
  it("should build URL from url only", () => {
    const result = buildUrl({ url: "https://example.com/path" });
    expect(result).toBe("https://example.com/path");
  });

  it("should build URL from URL object", () => {
    const result = buildUrl({ url: new URL("https://example.com/path") });
    expect(result).toBe("https://example.com/path");
  });

  it("should throw when url is empty", () => {
    expect(() => buildUrl({ url: "" })).toThrow("Request URL is required");
  });

  it("should throw when url is undefined", () => {
    expect(() => buildUrl({})).toThrow("Request URL is required");
  });

  it("should build URL with baseUrl without trailing slash", () => {
    const result = buildUrl({ baseUrl: "https://api.example.com", url: "/path" });
    expect(result).toBe("https://api.example.com/path");
  });

  it("should build URL with baseUrl with trailing slash", () => {
    const result = buildUrl({ baseUrl: "https://api.example.com/", url: "path" });
    expect(result).toBe("https://api.example.com/path");
  });

  it("should build URL with baseUrl as URL object", () => {
    const result = buildUrl({ baseUrl: new URL("https://api.example.com"), url: "/path" });
    expect(result).toBe("https://api.example.com/path");
  });

  it("should append searchParams to final URL", () => {
    const result = buildUrl({
      url: "https://example.com/path",
      searchParams: { key: "value" },
    });
    expect(result).toBe("https://example.com/path?key=value");
  });

  it("should handle searchParams with baseUrl", () => {
    const result = buildUrl({
      baseUrl: "https://api.example.com",
      url: "/path",
      searchParams: { key: "value" },
    });
    expect(result).toBe("https://api.example.com/path?key=value");
  });

  it("should handle URL with existing search params and append more", () => {
    const result = buildUrl({
      url: "https://example.com/path?existing=value",
      searchParams: { key: "value" },
    });
    expect(result).toBe("https://example.com/path?existing=value&key=value");
  });

  it("should handle relative URL with baseUrl", () => {
    const result = buildUrl({
      baseUrl: "https://api.example.com/v1/",
      url: "users",
    });
    expect(result).toBe("https://api.example.com/v1/users");
  });

  it("should handle absolute URL ignoring baseUrl", () => {
    const result = buildUrl({
      baseUrl: "https://api.example.com",
      url: "https://other.com/path",
    });
    expect(result).toBe("https://other.com/path");
  });

  it("should handle protocol-relative URL", () => {
    const result = buildUrl({
      baseUrl: "https://example.com",
      url: "//other.com/path",
    });
    expect(result).toBe("https://other.com/path");
  });
});

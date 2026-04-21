import { describe, it, expect } from "vitest";
import { mergeHeaders, createHttpHeadersView } from "../headers.js";

describe("mergeHeaders", () => {
  it("should return empty object when no sources provided", () => {
    const result = mergeHeaders();
    expect(result).toEqual({});
  });

  it("should return empty object when all sources are undefined", () => {
    const result = mergeHeaders(undefined, undefined);
    expect(result).toEqual({});
  });

  it("should merge record headers with lowercase keys", () => {
    const result = mergeHeaders({ "X-Custom": "value1", "Authorization": "Bearer token" });
    expect(result).toEqual({
      "x-custom": "value1",
      "authorization": "Bearer token",
    });
  });

  it("should merge multiple record headers with last writer wins", () => {
    const result = mergeHeaders(
      { "x-common": "value1", "x-first": "first" },
      { "x-common": "value2", "x-second": "second" }
    );
    expect(result).toEqual({
      "x-common": "value2",
      "x-first": "first",
      "x-second": "second",
    });
  });

  it("should merge Headers object", () => {
    const headers = new Headers({ "X-Custom": "value" });
    const result = mergeHeaders(headers);
    expect(result).toEqual({ "x-custom": "value" });
  });

  it("should merge array of tuples", () => {
    const result = mergeHeaders([["X-Custom", "value"], ["Authorization", "Bearer"]]);
    expect(result).toEqual({
      "x-custom": "value",
      "authorization": "Bearer",
    });
  });

  it("should merge iterable headers", () => {
    const iterable = new Map([["X-Custom", "value"]]);
    const result = mergeHeaders(iterable as Iterable<[string, string]>);
    expect(result).toEqual({ "x-custom": "value" });
  });

  it("should skip undefined and null values in record", () => {
    const result = mergeHeaders({
      "x-valid": "value",
      "x-undefined": undefined,
      "x-null": null,
    } as Record<string, string | undefined | null>);
    expect(result).toEqual({ "x-valid": "value" });
  });

  it("should convert values to strings", () => {
    const result = mergeHeaders({ "x-number": 123 as any, "x-boolean": true as any });
    expect(result).toEqual({
      "x-number": "123",
      "x-boolean": "true",
    });
  });

  it("should trim header names", () => {
    const result = mergeHeaders({ "  X-Custom  ": "value" });
    expect(result).toEqual({ "x-custom": "value" });
  });

  it("should handle mixed sources", () => {
    const headers = new Headers({ "x-from-headers": "value1" });
    const result = mergeHeaders(
      { "x-from-record": "value2" },
      headers,
      [["x-from-array", "value3"]]
    );
    expect(result).toEqual({
      "x-from-record": "value2",
      "x-from-headers": "value1",
      "x-from-array": "value3",
    });
  });
});

describe("createHttpHeadersView", () => {
  it("should return null for non-existent header", () => {
    const headers = createHttpHeadersView({});
    expect(headers.get("x-custom")).toBeNull();
  });

  it("should return header value with case-insensitive lookup", () => {
    const headers = createHttpHeadersView({ "x-custom": "value" });
    expect(headers.get("X-Custom")).toBe("value");
    expect(headers.get("x-custom")).toBe("value");
    expect(headers.get("X-CUSTOM")).toBe("value");
  });

  it("should check header existence with case-insensitive lookup", () => {
    const headers = createHttpHeadersView({ "x-custom": "value" });
    expect(headers.has("X-Custom")).toBe(true);
    expect(headers.has("x-custom")).toBe(true);
    expect(headers.has("X-CUSTOM")).toBe(true);
    expect(headers.has("x-other")).toBe(false);
  });

  it("should iterate over all entries", () => {
    const headers = createHttpHeadersView({ "x-first": "value1", "x-second": "value2" });
    const entries = Array.from(headers.entries());
    expect(entries).toContainEqual(["x-first", "value1"]);
    expect(entries).toContainEqual(["x-second", "value2"]);
  });

  it("should return header names as provided (assumes pre-normalized keys)", () => {
    // Note: createHttpHeadersView expects normalized (lowercase) keys
    const headers = createHttpHeadersView({ "x-custom": "value" });
    const entries = Array.from(headers.entries());
    expect(entries).toEqual([["x-custom", "value"]]);
  });
});

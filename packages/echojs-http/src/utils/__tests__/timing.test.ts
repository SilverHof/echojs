import { describe, it, expect } from "vitest";
import { mergeTimings } from "../timing.js";
import type { AdapterTimings } from "../../types/adapter.js";

describe("mergeTimings", () => {
  it("should return undefined when both are undefined", () => {
    const result = mergeTimings(undefined, undefined);
    expect(result).toBeUndefined();
  });

  it("should return a when b is undefined", () => {
    const a: AdapterTimings = { request: 100, response: 200 };
    const result = mergeTimings(a, undefined);
    expect(result).toEqual({ request: 100, response: 200 });
  });

  it("should return b when a is undefined", () => {
    const b: AdapterTimings = { request: 100, response: 200 };
    const result = mergeTimings(undefined, b);
    expect(result).toEqual({ request: 100, response: 200 });
  });

  it("should merge with b overriding a values", () => {
    const a: AdapterTimings = { request: 100, response: 200, read: 300 };
    const b: AdapterTimings = { request: 150, response: 250 };
    const result = mergeTimings(a, b);
    expect(result).toEqual({ request: 150, response: 250, read: 300 });
  });

  it("should add new properties from b", () => {
    const a: AdapterTimings = { request: 100 };
    const b: AdapterTimings = { response: 200 };
    const result = mergeTimings(a, b);
    expect(result).toEqual({ request: 100, response: 200 });
  });

  it("should handle all timing properties", () => {
    const a: AdapterTimings = { request: 100 };
    const b: AdapterTimings = { response: 200, read: 300 };
    const result = mergeTimings(a, b);
    expect(result).toEqual({ request: 100, response: 200, read: 300 });
  });

  it("should override with undefined if explicitly set", () => {
    const a: AdapterTimings = { request: 100, response: 200 };
    const b: AdapterTimings = { request: undefined };
    const result = mergeTimings(a, b);
    expect(result).toEqual({ request: undefined, response: 200 });
  });
});

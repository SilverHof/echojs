import { describe, it, expect } from "vitest";
import { isObject, isAfterResponseRetryDirective } from "../is.js";
import type { AfterResponseRetryDirective } from "../../types/hooks.js";

describe("isObject", () => {
  it("should return true for plain objects", () => {
    expect(isObject({})).toBe(true);
    expect(isObject({ key: "value" })).toBe(true);
  });

  it("should return false for null", () => {
    expect(isObject(null)).toBe(false);
  });

  it("should return false for arrays", () => {
    expect(isObject([])).toBe(false);
    expect(isObject([1, 2, 3])).toBe(false);
  });

  it("should return false for primitives", () => {
    expect(isObject("string")).toBe(false);
    expect(isObject(123)).toBe(false);
    expect(isObject(true)).toBe(false);
    expect(isObject(undefined)).toBe(false);
    expect(isObject(Symbol())).toBe(false);
  });

  it("should return false for functions", () => {
    expect(isObject(() => {})).toBe(false);
    expect(isObject(function () {})).toBe(false);
  });

  it("should return true for class instances", () => {
    class MyClass {}
    expect(isObject(new MyClass())).toBe(true);
  });
});

describe("isAfterResponseRetryDirective", () => {
  it("should return true for valid retry directive", () => {
    const directive: AfterResponseRetryDirective = { kind: "retry" };
    expect(isAfterResponseRetryDirective(directive)).toBe(true);
  });

  it("should return true for retry directive with delayMs", () => {
    const directive: AfterResponseRetryDirective = { kind: "retry", delayMs: 1000 };
    expect(isAfterResponseRetryDirective(directive)).toBe(true);
  });

  it("should return false for object with wrong kind", () => {
    const directive = { kind: "other" };
    expect(isAfterResponseRetryDirective(directive)).toBe(false);
  });

  it("should return false for non-objects", () => {
    expect(isAfterResponseRetryDirective(null)).toBe(false);
    expect(isAfterResponseRetryDirective(undefined)).toBe(false);
    expect(isAfterResponseRetryDirective("retry")).toBe(false);
    expect(isAfterResponseRetryDirective(123)).toBe(false);
  });

  it("should return false for objects without kind property", () => {
    expect(isAfterResponseRetryDirective({})).toBe(false);
    expect(isAfterResponseRetryDirective({ delayMs: 1000 })).toBe(false);
  });

  it("should return false for arrays", () => {
    expect(isAfterResponseRetryDirective(["retry"])).toBe(false);
  });
});

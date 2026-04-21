import { describe, it, expect } from "vitest";
import { invariant } from "../invariant.js";

describe("invariant", () => {
  it("should not throw when condition is true", () => {
    expect(() => invariant(true, "error message")).not.toThrow();
  });

  it("should not throw when condition is truthy", () => {
    expect(() => invariant(1, "error message")).not.toThrow();
    expect(() => invariant("string", "error message")).not.toThrow();
    expect(() => invariant({}, "error message")).not.toThrow();
    expect(() => invariant([], "error message")).not.toThrow();
  });

  it("should throw when condition is false", () => {
    expect(() => invariant(false, "error message")).toThrow("error message");
  });

  it("should throw when condition is falsy", () => {
    expect(() => invariant(0, "zero is falsy")).toThrow("zero is falsy");
    expect(() => invariant("", "empty string is falsy")).toThrow("empty string is falsy");
    expect(() => invariant(null, "null is falsy")).toThrow("null is falsy");
    expect(() => invariant(undefined, "undefined is falsy")).toThrow("undefined is falsy");
  });

  it("should throw Error instance", () => {
    try {
      invariant(false, "test message");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe("test message");
    }
  });
});

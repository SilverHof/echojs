import { describe, it, expect } from "vitest";
import { mergeRecord, mergeHooks } from "../merge.js";
import type { HttpHooks } from "../../types/hooks.js";

describe("mergeRecord", () => {
  it("should return copy of parent when child is undefined", () => {
    const parent = { key: "value" };
    const result = mergeRecord(parent, undefined);
    expect(result).toEqual(parent);
    expect(result).not.toBe(parent);
  });

  it("should merge parent and child with child winning", () => {
    const parent = { key1: "parent1", key2: "parent2" };
    const child = { key2: "child2", key3: "child3" };
    const result = mergeRecord(parent, child);
    expect(result).toEqual({
      key1: "parent1",
      key2: "child2",
      key3: "child3",
    });
  });

  it("should handle empty parent", () => {
    const child = { key: "value" };
    const result = mergeRecord({}, child);
    expect(result).toEqual({ key: "value" });
  });

  it("should handle empty child", () => {
    const parent = { key: "value" };
    const result = mergeRecord(parent, {});
    expect(result).toEqual({ key: "value" });
  });

  it("should handle nested objects as references", () => {
    const nested = { a: 1 };
    const parent = { nested };
    const child = {};
    const result = mergeRecord(parent, child);
    expect(result.nested).toBe(nested);
  });
});

describe("mergeHooks", () => {
  const emptyHooks: HttpHooks = {
    init: [],
    beforeRequest: [],
    beforeRedirect: [],
    beforeRetry: [],
    afterResponse: [],
    beforeError: [],
  };

  it("should return parent when child is undefined", () => {
    const result = mergeHooks(emptyHooks, undefined);
    expect(result).toBe(emptyHooks);
  });

  it("should concatenate init hooks", () => {
    const fn1 = () => {};
    const fn2 = () => {};
    const parent: HttpHooks = { ...emptyHooks, init: [fn1] };
    const child: Partial<HttpHooks> = { init: [fn2] };
    const result = mergeHooks(parent, child);
    expect(result.init).toEqual([fn1, fn2]);
  });

  it("should concatenate beforeRequest hooks", () => {
    const fn1 = () => {};
    const fn2 = () => {};
    const parent: HttpHooks = { ...emptyHooks, beforeRequest: [fn1] };
    const child: Partial<HttpHooks> = { beforeRequest: [fn2] };
    const result = mergeHooks(parent, child);
    expect(result.beforeRequest).toEqual([fn1, fn2]);
  });

  it("should concatenate beforeRedirect hooks", () => {
    const fn1 = () => {};
    const fn2 = () => {};
    const parent: HttpHooks = { ...emptyHooks, beforeRedirect: [fn1] };
    const child: Partial<HttpHooks> = { beforeRedirect: [fn2] };
    const result = mergeHooks(parent, child);
    expect(result.beforeRedirect).toEqual([fn1, fn2]);
  });

  it("should concatenate beforeRetry hooks", () => {
    const fn1 = () => {};
    const fn2 = () => {};
    const parent: HttpHooks = { ...emptyHooks, beforeRetry: [fn1] };
    const child: Partial<HttpHooks> = { beforeRetry: [fn2] };
    const result = mergeHooks(parent, child);
    expect(result.beforeRetry).toEqual([fn1, fn2]);
  });

  it("should concatenate afterResponse hooks", () => {
    const fn1 = () => {};
    const fn2 = () => {};
    const parent: HttpHooks = { ...emptyHooks, afterResponse: [fn1] };
    const child: Partial<HttpHooks> = { afterResponse: [fn2] };
    const result = mergeHooks(parent, child);
    expect(result.afterResponse).toEqual([fn1, fn2]);
  });

  it("should concatenate beforeError hooks", () => {
    const fn1 = () => {};
    const fn2 = () => {};
    const parent: HttpHooks = { ...emptyHooks, beforeError: [fn1] };
    const child: Partial<HttpHooks> = { beforeError: [fn2] };
    const result = mergeHooks(parent, child);
    expect(result.beforeError).toEqual([fn1, fn2]);
  });

  it("should handle multiple hooks in child", () => {
    const fn1 = () => {};
    const fn2 = () => {};
    const fn3 = () => {};
    const parent: HttpHooks = { ...emptyHooks, beforeRequest: [fn1] };
    const child: Partial<HttpHooks> = { beforeRequest: [fn2, fn3] };
    const result = mergeHooks(parent, child);
    expect(result.beforeRequest).toEqual([fn1, fn2, fn3]);
  });

  it("should handle empty parent hooks", () => {
    const fn = () => {};
    const parent = emptyHooks;
    const child: Partial<HttpHooks> = { beforeRequest: [fn] };
    const result = mergeHooks(parent, child);
    expect(result.beforeRequest).toEqual([fn]);
  });

  it("should handle empty child hooks", () => {
    const fn = () => {};
    const parent: HttpHooks = { ...emptyHooks, beforeRequest: [fn] };
    const child: Partial<HttpHooks> = {};
    const result = mergeHooks(parent, child);
    expect(result.beforeRequest).toEqual([fn]);
  });
});

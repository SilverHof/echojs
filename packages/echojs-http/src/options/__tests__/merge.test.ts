import { describe, it, expect } from "vitest";
import { mergeRequestOptions, freezeHooks } from "../merge.js";
import { EMPTY_HOOKS } from "../defaults.js";
import type { RequestOptions } from "../../types/public.js";

describe("mergeRequestOptions", () => {
  it("should use child values when both are defined", () => {
    const parent: RequestOptions = { method: "GET", url: "https://parent.com" };
    const child: RequestOptions = { method: "POST", url: "https://child.com" };
    const result = mergeRequestOptions(parent, child);
    expect(result.method).toBe("POST");
    expect(result.url).toBe("https://child.com");
  });

  it("should use parent values when child is undefined", () => {
    const parent: RequestOptions = { method: "GET", url: "https://parent.com" };
    const child: RequestOptions = {};
    const result = mergeRequestOptions(parent, child);
    expect(result.method).toBe("GET");
    expect(result.url).toBe("https://parent.com");
  });

  it("should merge headers with child overriding parent", () => {
    const parent: RequestOptions = { headers: { "x-common": "parent", "x-parent": "value" } };
    const child: RequestOptions = { headers: { "x-common": "child", "x-child": "value" } };
    const result = mergeRequestOptions(parent, child);
    expect(result.headers).toEqual({
      "x-common": "child",
      "x-parent": "value",
      "x-child": "value",
    });
  });

  it("should merge searchParams with child winning", () => {
    const parent: RequestOptions = { searchParams: { key: "parent" } };
    const child: RequestOptions = { searchParams: { key: "child" } };
    const result = mergeRequestOptions(parent, child);
    expect(result.searchParams).toEqual({ key: "child" });
  });

  it("should merge timeout with child overriding parent values", () => {
    const parent: RequestOptions = { timeout: { request: 1000, response: 2000 } };
    const child: RequestOptions = { timeout: { request: 3000 } };
    const result = mergeRequestOptions(parent, child);
    expect(result.timeout).toEqual({ request: 3000, response: 2000 });
  });

  it("should merge retry with child overriding parent values", () => {
    const parent: RequestOptions = { retry: { limit: 3, methods: ["GET"] } };
    const child: RequestOptions = { retry: { limit: 5 } };
    const result = mergeRequestOptions(parent, child);
    expect(result.retry).toEqual({ limit: 5, methods: ["GET"] });
  });

  it("should merge redirect with child overriding parent values", () => {
    const parent: RequestOptions = { redirect: { follow: true, max: 5 } };
    const child: RequestOptions = { redirect: { max: 10 } };
    const result = mergeRequestOptions(parent, child);
    expect(result.redirect).toEqual({ follow: true, max: 10 });
  });

  it("should merge context with child overriding parent", () => {
    const parent: RequestOptions = { context: { key1: "value1", key2: "value2" } };
    const child: RequestOptions = { context: { key2: "overridden", key3: "value3" } };
    const result = mergeRequestOptions(parent, child);
    expect(result.context).toEqual({ key1: "value1", key2: "overridden", key3: "value3" });
  });

  it("should merge hooks by concatenating arrays", () => {
    const hook1 = () => {};
    const hook2 = () => {};
    const hook3 = () => {};
    const parent: RequestOptions = { hooks: { beforeRequest: [hook1] } };
    const child: RequestOptions = { hooks: { beforeRequest: [hook2, hook3] } };
    const result = mergeRequestOptions(parent, child);
    expect(result.hooks?.beforeRequest).toHaveLength(3);
    expect(result.hooks?.beforeRequest?.[0]).toBe(hook1);
    expect(result.hooks?.beforeRequest?.[1]).toBe(hook2);
    expect(result.hooks?.beforeRequest?.[2]).toBe(hook3);
  });

  it("should handle undefined parent hooks", () => {
    const hook = () => {};
    const parent: RequestOptions = {};
    const child: RequestOptions = { hooks: { beforeRequest: [hook] } };
    const result = mergeRequestOptions(parent, child);
    expect(result.hooks?.beforeRequest).toEqual([hook]);
  });

  it("should handle undefined child hooks", () => {
    const hook = () => {};
    const parent: RequestOptions = { hooks: { beforeRequest: [hook] } };
    const child: RequestOptions = {};
    const result = mergeRequestOptions(parent, child);
    expect(result.hooks?.beforeRequest).toEqual([hook]);
  });

  it("should merge all hook types", () => {
    const hooks = {
      init: [() => {}],
      beforeRequest: [() => {}],
      beforeRedirect: [() => {}],
      beforeRetry: [() => {}],
      afterResponse: [() => {}],
      beforeError: [() => {}],
    };
    const parent: RequestOptions = { hooks: hooks };
    const child: RequestOptions = { hooks: hooks };
    const result = mergeRequestOptions(parent, child);
    expect(result.hooks?.init).toHaveLength(2);
    expect(result.hooks?.beforeRequest).toHaveLength(2);
    expect(result.hooks?.beforeRedirect).toHaveLength(2);
    expect(result.hooks?.beforeRetry).toHaveLength(2);
    expect(result.hooks?.afterResponse).toHaveLength(2);
    expect(result.hooks?.beforeError).toHaveLength(2);
  });

  it("should merge tracing with child overriding", () => {
    const parent: RequestOptions = { tracing: { requestIdHeader: "x-parent-id" } };
    const child: RequestOptions = { tracing: { requestIdHeader: "x-child-id" } };
    const result = mergeRequestOptions(parent, child);
    expect(result.tracing?.requestIdHeader).toBe("x-child-id");
  });

  it("should use child adapter when both are defined", () => {
    const parentAdapter = { name: "parent", supports: {} as any, execute: async () => ({}) as any };
    const childAdapter = { name: "child", supports: {} as any, execute: async () => ({}) as any };
    const parent: RequestOptions = { adapter: parentAdapter };
    const child: RequestOptions = { adapter: childAdapter };
    const result = mergeRequestOptions(parent, child);
    expect(result.adapter).toBe(childAdapter);
  });

  it("should prefer child body over parent body", () => {
    const parent: RequestOptions = { body: "parent body" };
    const child: RequestOptions = { body: "raw body" };
    const result = mergeRequestOptions(parent, child);
    expect(result.body).toBe("raw body");
  });

  it("should prefer child json over parent json", () => {
    const parent: RequestOptions = { json: { data: "parent" } };
    const child: RequestOptions = { json: { data: "child" } };
    const result = mergeRequestOptions(parent, child);
    expect(result.json).toEqual({ data: "child" });
  });

  it("should merge body and json independently", () => {
    // Note: mergeRequestOptions merges body and json independently
    // Validation that only one should be set happens in validateRequestOptions
    const parent: RequestOptions = { json: { data: "parent" } };
    const child: RequestOptions = { body: "raw body" };
    const result = mergeRequestOptions(parent, child);
    expect(result.body).toBe("raw body");
    expect(result.json).toEqual({ data: "parent" });
  });

  it("should prefer child form over parent form", () => {
    const parent: RequestOptions = { form: { key: "parent" } };
    const child: RequestOptions = { form: { key: "child" } };
    const result = mergeRequestOptions(parent, child);
    expect(result.form).toEqual({ key: "child" });
  });
});

describe("freezeHooks", () => {
  it("should return EMPTY_HOOKS when all arrays are empty", () => {
    const hooks = {
      init: [],
      beforeRequest: [],
      beforeRedirect: [],
      beforeRetry: [],
      afterResponse: [],
      beforeError: [],
    };
    const result = freezeHooks(hooks);
    expect(result).toBe(EMPTY_HOOKS);
  });

  it("should return same hooks when arrays are not empty", () => {
    const hooks = {
      init: [() => {}],
      beforeRequest: [],
      beforeRedirect: [],
      beforeRetry: [],
      afterResponse: [],
      beforeError: [],
    };
    const result = freezeHooks(hooks);
    expect(result).toEqual(hooks);
    expect(result).not.toBe(EMPTY_HOOKS);
  });
});

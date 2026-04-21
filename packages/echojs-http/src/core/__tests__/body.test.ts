import { describe, it, expect } from "vitest";
import { buildNormalizedBody } from "../body.js";
import type { RequestOptions } from "../../types/public.js";

describe("buildNormalizedBody", () => {
  it("should return none kind when no body is set", () => {
    const opts: RequestOptions = {};
    const result = buildNormalizedBody(opts);
    expect(result).toEqual({ kind: "none" });
  });

  it("should return json kind with serialized data when json is set", () => {
    const opts: RequestOptions = { json: { key: "value", nested: { a: 1 } } };
    const result = buildNormalizedBody(opts);
    expect(result.kind).toBe("json");
    expect(result).toHaveProperty("data", JSON.stringify({ key: "value", nested: { a: 1 } }));
    expect(result).toHaveProperty("contentType", "application/json; charset=utf-8");
  });

  it("should return form kind with serialized data when form is set with record", () => {
    const opts: RequestOptions = { form: { key1: "value1", key2: "value2" } };
    const result = buildNormalizedBody(opts);
    expect(result.kind).toBe("form");
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("contentType", "application/x-www-form-urlencoded");
    const data = result as { kind: "form"; data: URLSearchParams };
    expect(data.data.get("key1")).toBe("value1");
    expect(data.data.get("key2")).toBe("value2");
  });

  it("should return form kind when form is set with URLSearchParams", () => {
    const params = new URLSearchParams({ key: "value" });
    const opts: RequestOptions = { form: params };
    const result = buildNormalizedBody(opts);
    expect(result.kind).toBe("form");
  });

  it("should return raw kind when body is set", () => {
    const opts: RequestOptions = { body: "raw string" };
    const result = buildNormalizedBody(opts);
    expect(result).toEqual({ kind: "raw", body: "raw string" });
  });

  it("should return raw kind when body is Uint8Array", () => {
    const data = new Uint8Array([1, 2, 3]);
    const opts: RequestOptions = { body: data };
    const result = buildNormalizedBody(opts);
    expect(result).toEqual({ kind: "raw", body: data });
  });

  it("should return raw kind when body is ArrayBuffer", () => {
    const data = new ArrayBuffer(8);
    const opts: RequestOptions = { body: data };
    const result = buildNormalizedBody(opts);
    expect(result).toEqual({ kind: "raw", body: data });
  });

  it("should return raw kind when body is FormData", () => {
    const formData = new FormData();
    const opts: RequestOptions = { body: formData };
    const result = buildNormalizedBody(opts);
    expect(result).toEqual({ kind: "raw", body: formData });
  });

  it("should return raw kind when body is Blob", () => {
    const blob = new Blob(["content"]);
    const opts: RequestOptions = { body: blob };
    const result = buildNormalizedBody(opts);
    expect(result).toEqual({ kind: "raw", body: blob });
  });

  it("should return raw kind when body is ReadableStream", () => {
    const stream = new ReadableStream<Uint8Array>();
    const opts: RequestOptions = { body: stream };
    const result = buildNormalizedBody(opts);
    expect(result).toEqual({ kind: "raw", body: stream });
  });

  it("should prefer json over form when both are set", () => {
    // Note: This is the current implementation behavior
    const opts: RequestOptions = {
      json: { key: "value" },
      form: { other: "value" },
    };
    const result = buildNormalizedBody(opts);
    // Current implementation checks json first
    expect(result.kind).toBe("json");
  });

  it("should prefer json over body when both are set", () => {
    const opts: RequestOptions = {
      json: { key: "value" },
      body: "raw body",
    };
    const result = buildNormalizedBody(opts);
    expect(result.kind).toBe("json");
  });

  it("should serialize null json", () => {
    const opts: RequestOptions = { json: null };
    const result = buildNormalizedBody(opts);
    expect(result.kind).toBe("json");
    expect((result as { data: string }).data).toBe("null");
  });

  it("should serialize primitive json values", () => {
    const stringOpts: RequestOptions = { json: "string value" };
    expect(buildNormalizedBody(stringOpts)).toHaveProperty("data", '"string value"');

    const numberOpts: RequestOptions = { json: 42 };
    expect(buildNormalizedBody(numberOpts)).toHaveProperty("data", "42");

    const booleanOpts: RequestOptions = { json: true };
    expect(buildNormalizedBody(booleanOpts)).toHaveProperty("data", "true");
  });

  it("should serialize array json", () => {
    const opts: RequestOptions = { json: [1, 2, 3] };
    const result = buildNormalizedBody(opts);
    expect(result.kind).toBe("json");
    expect((result as { data: string }).data).toBe("[1,2,3]");
  });

  it("should handle form with nested values", () => {
    const opts: RequestOptions = { form: { nested: { key: "value" } } };
    const result = buildNormalizedBody(opts);
    expect(result.kind).toBe("form");
    const data = result as { data: URLSearchParams };
    expect(data.data.get("nested")).toBe('{"key":"value"}');
  });

  it("should skip undefined and null in form record", () => {
    const opts: RequestOptions = {
      form: { valid: "value", undefinedKey: undefined, nullKey: null },
    };
    const result = buildNormalizedBody(opts);
    const data = result as { data: URLSearchParams };
    expect(data.data.get("valid")).toBe("value");
    expect(data.data.has("undefinedKey")).toBe(false);
    expect(data.data.has("nullKey")).toBe(false);
  });
});

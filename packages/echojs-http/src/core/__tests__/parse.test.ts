import { describe, it, expect } from "vitest";
import { parseJsonBody } from "../parse-json-body.js";
import { parseTextBody } from "../parse-text-body.js";
import { parseBytesBody } from "../parse-bytes-body.js";
import { ParseError } from "../../errors/parse-error.js";

describe("parseJsonBody", () => {
  it("should parse valid JSON object", async () => {
    const result = await parseJsonBody('{"key":"value"}', {});
    expect(result).toEqual({ key: "value" });
  });

  it("should parse valid JSON array", async () => {
    const result = await parseJsonBody("[1,2,3]", {});
    expect(result).toEqual([1, 2, 3]);
  });

  it("should parse valid JSON string", async () => {
    const result = await parseJsonBody('"hello"', {});
    expect(result).toBe("hello");
  });

  it("should parse valid JSON number", async () => {
    const result = await parseJsonBody("42", {});
    expect(result).toBe(42);
  });

  it("should parse valid JSON boolean", async () => {
    const result = await parseJsonBody("true", {});
    expect(result).toBe(true);
  });

  it("should parse valid JSON null", async () => {
    const result = await parseJsonBody("null", {});
    expect(result).toBe(null);
  });

  it("should parse empty JSON object", async () => {
    const result = await parseJsonBody("{}", {});
    expect(result).toEqual({});
  });

  it("should parse empty JSON array", async () => {
    const result = await parseJsonBody("[]", {});
    expect(result).toEqual([]);
  });

  it("should throw ParseError for invalid JSON", async () => {
    await expect(parseJsonBody("not json", {})).rejects.toThrow(ParseError);
  });

  it("should throw ParseError with correct message for invalid JSON", async () => {
    await expect(parseJsonBody("{invalid}", {})).rejects.toThrow("Invalid JSON body");
  });

  it("should include cause in ParseError", async () => {
    try {
      await parseJsonBody("invalid", {});
    } catch (error) {
      expect(error).toBeInstanceOf(ParseError);
      expect((error as ParseError).cause).toBeInstanceOf(SyntaxError);
    }
  });

  it("should parse nested JSON", async () => {
    const result = await parseJsonBody('{"outer":{"inner":"value"}}', {});
    expect(result).toEqual({ outer: { inner: "value" } });
  });

  it("should parse JSON with unicode characters", async () => {
    const result = await parseJsonBody('{"message":"Hello 世界"}', {});
    expect(result).toEqual({ message: "Hello 世界" });
  });
});

describe("parseTextBody", () => {
  it("should decode bytes to UTF-8 text by default", () => {
    const bytes = new TextEncoder().encode("Hello World");
    const result = parseTextBody(bytes, undefined, {});
    expect(result).toBe("Hello World");
  });

  it("should decode empty bytes to empty string", () => {
    const bytes = new Uint8Array(0);
    const result = parseTextBody(bytes, undefined, {});
    expect(result).toBe("");
  });

  it("should decode with specified encoding", () => {
    const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello" in ASCII/UTF-8
    const result = parseTextBody(bytes, "utf-8", {});
    expect(result).toBe("Hello");
  });

  it("should handle unicode characters", () => {
    const bytes = new TextEncoder().encode("Hello 世界 🌍");
    const result = parseTextBody(bytes, undefined, {});
    expect(result).toBe("Hello 世界 🌍");
  });

  it("should handle invalid UTF-8 with replacement characters", () => {
    // Bun's TextDecoder uses fatal: false by default, replacing invalid sequences with U+FFFD
    const bytes = new Uint8Array([0xff, 0xfe]);
    const result = parseTextBody(bytes, "utf-8", {});
    expect(result).toContain("\uFFFD");
  });

  it("should not throw for invalid UTF-8 sequences", () => {
    const bytes = new Uint8Array([0xff, 0xfe]);
    expect(() => parseTextBody(bytes, "utf-8", {})).not.toThrow();
  });

  it("should decode multibyte characters correctly", () => {
    const text = "日本語テキスト";
    const bytes = new TextEncoder().encode(text);
    const result = parseTextBody(bytes, undefined, {});
    expect(result).toBe(text);
  });

  it("should handle binary data by replacing invalid sequences", () => {
    const bytes = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    const result = parseTextBody(bytes, undefined, {});
    expect(typeof result).toBe("string");
  });
});

describe("parseBytesBody", () => {
  it("should return Uint8Array as-is", () => {
    const input = new Uint8Array([1, 2, 3, 4, 5]);
    const result = parseBytesBody(input);
    expect(result).toBe(input);
  });

  it("should convert ArrayBuffer to Uint8Array", () => {
    const buffer = new ArrayBuffer(5);
    const view = new Uint8Array(buffer);
    view.set([1, 2, 3, 4, 5]);
    const result = parseBytesBody(buffer);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
  });

  it("should handle empty ArrayBuffer", () => {
    const buffer = new ArrayBuffer(0);
    const result = parseBytesBody(buffer);
    expect(result).toEqual(new Uint8Array(0));
  });

  it("should handle empty Uint8Array", () => {
    const input = new Uint8Array(0);
    const result = parseBytesBody(input);
    expect(result).toBe(input);
  });

  it("should create new view for ArrayBuffer (not copy data)", () => {
    const buffer = new ArrayBuffer(4);
    const view = new Uint8Array(buffer);
    view.set([1, 2, 3, 4]);
    const result = parseBytesBody(buffer);
    // Modifying result should affect the original buffer
    result[0] = 99;
    expect(view[0]).toBe(99);
  });
});

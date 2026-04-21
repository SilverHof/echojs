import { describe, it, expect } from "vitest";
import { HttpResponseImpl, buildBodyValue } from "../response.js";
import { HTTPStatusError } from "../../errors/http-status-error.js";
import { ParseError } from "../../errors/parse-error.js";
import type { NormalizedRequestOptions } from "../../types/internal.js";

describe("HttpResponseImpl", () => {
  const createResponse = (overrides: Partial<ConstructorParameters<typeof HttpResponseImpl>[0]> = {}) => {
    return new HttpResponseImpl({
      url: "https://example.com",
      status: 200,
      statusText: "OK",
      ok: true,
      headers: { "content-type": "application/json" },
      body: undefined,
      rawBody: new Uint8Array([123, 34, 107, 101, 121, 34, 58, 34, 118, 97, 108, 117, 101, 34, 125]), // {"key":"value"}
      bodyState: { kind: "bytes", data: new Uint8Array([123, 34, 107, 101, 121, 34, 58, 34, 118, 97, 108, 117, 101, 34, 125]) },
      timings: { response: 100 },
      request: { context: {} } as NormalizedRequestOptions,
      retryCount: 0,
      ...overrides,
    });
  };

  describe("basic properties", () => {
    it("should store url", () => {
      const response = createResponse({ url: "https://api.example.com/users" });
      expect(response.url).toBe("https://api.example.com/users");
    });

    it("should store status", () => {
      const response = createResponse({ status: 404 });
      expect(response.status).toBe(404);
    });

    it("should store statusText", () => {
      const response = createResponse({ statusText: "Not Found" });
      expect(response.statusText).toBe("Not Found");
    });

    it("should store ok", () => {
      const response = createResponse({ ok: false });
      expect(response.ok).toBe(false);
    });

    it("should store retryCount", () => {
      const response = createResponse({ retryCount: 3 });
      expect(response.retryCount).toBe(3);
    });

    it("should store timings", () => {
      const timings = { request: 50, response: 100, read: 20 };
      const response = createResponse({ timings });
      expect(response.timings).toEqual(timings);
    });

    it("should store request", () => {
      const request = { context: { key: "value" } } as NormalizedRequestOptions;
      const response = createResponse({ request });
      expect(response.request).toBe(request);
    });

    it("should store rawBody", () => {
      const rawBody = new Uint8Array([1, 2, 3]);
      const response = createResponse({ rawBody });
      expect(response.rawBody).toBe(rawBody);
    });
  });

  describe("headers", () => {
    it("should provide case-insensitive header access", () => {
      const response = createResponse({ headers: { "content-type": "application/json" } });
      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(response.headers.get("content-type")).toBe("application/json");
      expect(response.headers.get("CONTENT-TYPE")).toBe("application/json");
    });

    it("should check header existence", () => {
      const response = createResponse({ headers: { "x-custom": "value" } });
      expect(response.headers.has("X-Custom")).toBe(true);
      expect(response.headers.has("x-custom")).toBe(true);
      expect(response.headers.has("missing")).toBe(false);
    });

    it("should iterate headers", () => {
      const response = createResponse({ headers: { "x-first": "1", "x-second": "2" } });
      const entries = Array.from(response.headers.entries());
      expect(entries).toContainEqual(["x-first", "1"]);
      expect(entries).toContainEqual(["x-second", "2"]);
    });

    it("should return null for missing header", () => {
      const response = createResponse({ headers: {} });
      expect(response.headers.get("missing")).toBeNull();
    });
  });

  describe("bytes()", () => {
    it("should return bytes from bodyState", async () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const response = createResponse({
        rawBody: data,
        bodyState: { kind: "bytes", data },
      });
      const result = await response.bytes();
      expect(result).toEqual(data);
    });

    it("should read from stream and cache", async () => {
      const data = new Uint8Array([1, 2, 3]);
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(data);
          controller.close();
        },
      });
      const response = createResponse({
        rawBody: undefined,
        bodyState: { kind: "stream", stream },
      });

      const result1 = await response.bytes();
      expect(result1).toEqual(data);

      // Second call should return cached bytes
      const result2 = await response.bytes();
      expect(result2).toBe(result1);
    });


    it("should return empty array for none bodyState", async () => {
      const response = createResponse({
        rawBody: undefined,
        bodyState: { kind: "none" },
      });
      const result = await response.bytes();
      expect(result).toEqual(new Uint8Array(0));
    });
  });

  describe("text()", () => {
    it("should decode bytes to text", async () => {
      const text = "Hello World";
      const data = new TextEncoder().encode(text);
      const response = createResponse({
        rawBody: data,
        bodyState: { kind: "bytes", data },
      });
      const result = await response.text();
      expect(result).toBe(text);
    });

    it("should decode UTF-8 correctly", async () => {
      const text = "Hello 世界 🌍";
      const data = new TextEncoder().encode(text);
      const response = createResponse({
        rawBody: data,
        bodyState: { kind: "bytes", data },
      });
      const result = await response.text();
      expect(result).toBe(text);
    });
  });

  describe("json()", () => {
    it("should parse JSON response", async () => {
      const json = { key: "value", nested: { a: 1 } };
      const data = new TextEncoder().encode(JSON.stringify(json));
      const response = createResponse({
        rawBody: data,
        bodyState: { kind: "bytes", data },
      });
      const result = await response.json();
      expect(result).toEqual(json);
    });

    it("should parse JSON array", async () => {
      const json = [1, 2, 3];
      const data = new TextEncoder().encode(JSON.stringify(json));
      const response = createResponse({
        rawBody: data,
        bodyState: { kind: "bytes", data },
      });
      const result = await response.json();
      expect(result).toEqual(json);
    });

    it("should throw ParseError for invalid JSON", async () => {
      const data = new TextEncoder().encode("not json");
      const response = createResponse({
        rawBody: data,
        bodyState: { kind: "bytes", data },
      });
      await expect(response.json()).rejects.toThrow(ParseError);
    });
  });

  describe("arrayBuffer()", () => {
    it("should return ArrayBuffer", async () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const response = createResponse({
        rawBody: data,
        bodyState: { kind: "bytes", data },
      });
      const result = await response.arrayBuffer();
      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(new Uint8Array(result)).toEqual(data);
    });

    it("should return copy of data", async () => {
      const data = new Uint8Array([1, 2, 3]);
      const response = createResponse({
        rawBody: data,
        bodyState: { kind: "bytes", data },
      });
      const result1 = await response.arrayBuffer();
      const result2 = await response.arrayBuffer();
      expect(result1).not.toBe(result2);
      expect(new Uint8Array(result1)).toEqual(new Uint8Array(result2));
    });
  });

  describe("assertOk()", () => {
    it("should not throw for ok response", () => {
      const response = createResponse({ ok: true, status: 200 });
      expect(() => response.assertOk()).not.toThrow();
    });

    it("should throw HTTPStatusError for non-ok response", () => {
      const response = createResponse({ ok: false, status: 500, statusText: "Internal Server Error" });
      expect(() => response.assertOk()).toThrow(HTTPStatusError);
    });

    it("should include status in error message", () => {
      const response = createResponse({ ok: false, status: 404, statusText: "Not Found" });
      expect(() => response.assertOk()).toThrow("HTTP 404 Not Found");
    });
  });

  describe("unwrapJson()", () => {
    it("should return parsed JSON for ok response", async () => {
      const json = { result: "success" };
      const data = new TextEncoder().encode(JSON.stringify(json));
      const response = createResponse({
        ok: true,
        rawBody: data,
        bodyState: { kind: "bytes", data },
      });
      const result = await response.unwrapJson();
      expect(result).toEqual(json);
    });

    it("should throw HTTPStatusError for non-ok response", async () => {
      const response = createResponse({ ok: false, status: 500 });
      await expect(response.unwrapJson()).rejects.toThrow(HTTPStatusError);
    });

    it("should throw ParseError for invalid JSON even if ok", async () => {
      const data = new TextEncoder().encode("invalid json");
      const response = createResponse({
        ok: true,
        rawBody: data,
        bodyState: { kind: "bytes", data },
      });
      await expect(response.unwrapJson()).rejects.toThrow(ParseError);
    });
  });
});

describe("buildBodyValue", () => {
  it("should return undefined when bytes is undefined and not stream", () => {
    const result = buildBodyValue(undefined, "bytes", null);
    expect(result).toBeUndefined();
  });

  it("should return stream for stream responseType", () => {
    const stream = new ReadableStream<Uint8Array>();
    const result = buildBodyValue(undefined, "stream", stream);
    expect(result).toBe(stream);
  });

  it("should return undefined when stream is null for stream responseType", () => {
    const result = buildBodyValue(undefined, "stream", null);
    expect(result).toBeUndefined();
  });

  it("should return bytes for bytes responseType", () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const result = buildBodyValue(bytes, "bytes", null);
    expect(result).toBe(bytes);
  });

  it("should return text for text responseType", () => {
    const bytes = new TextEncoder().encode("Hello");
    const result = buildBodyValue(bytes, "text", null);
    expect(result).toBe("Hello");
  });

  it("should return undefined for json responseType", () => {
    const bytes = new TextEncoder().encode('{"key":"value"}');
    const result = buildBodyValue(bytes, "json", null);
    expect(result).toBeUndefined();
  });
});

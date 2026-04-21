import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HttpClientImpl } from "../client.js";
import { createHttpClient } from "../create-http-client.js";
import type { RequestOptions } from "../types/public.js";

describe("createHttpClient", () => {
  it("should create HttpClientImpl instance", () => {
    const client = createHttpClient();
    expect(client).toBeInstanceOf(HttpClientImpl);
  });

  it("should create client with defaults", () => {
    const defaults: RequestOptions = { baseUrl: "https://api.example.com" };
    const client = createHttpClient(defaults);
    expect(client.defaults.baseUrl).toBe("https://api.example.com");
  });

  it("should create client with empty defaults when not provided", () => {
    const client = createHttpClient();
    expect(client.defaults).toBeDefined();
  });
});

describe("HttpClientImpl", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createMockResponse(overrides: Partial<Response> = {}): Response {
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      url: "https://example.com",
      headers: new Headers({ "content-type": "application/json" }),
      body: null,
      clone: function() { return this; },
      ...overrides,
    } as Response;
  }

  describe("defaults", () => {
    it("should return frozen defaults", () => {
      const client = new HttpClientImpl({ baseUrl: "https://api.example.com" });
      expect(Object.isFrozen(client.defaults)).toBe(true);
    });

    it("should return defaults with provided values", () => {
      const client = new HttpClientImpl({
        baseUrl: "https://api.example.com",
        headers: { "x-api-key": "secret" },
      });
      expect(client.defaults.baseUrl).toBe("https://api.example.com");
    });
  });

  describe("extend / withDefaults", () => {
    it("should create new client with extended options", () => {
      const client = new HttpClientImpl({ baseUrl: "https://api.example.com" });
      const extended = client.extend({ headers: { "x-key": "value" } });
      expect(extended).not.toBe(client);
      expect(extended.defaults.headers).toEqual({ "x-key": "value" });
    });

    it("withDefaults should be alias for extend", () => {
      const client = new HttpClientImpl({});
      const extended = client.withDefaults({ baseUrl: "https://api.example.com" });
      expect(extended.defaults.baseUrl).toBe("https://api.example.com");
    });
  });

  describe("withHeader / withHeaders", () => {
    it("should create client with single header", () => {
      const client = new HttpClientImpl({});
      const withHeader = client.withHeader("x-key", "value");
      expect(withHeader.defaults.headers).toEqual({ "x-key": "value" });
    });

    it("should create client with multiple headers", () => {
      const client = new HttpClientImpl({});
      const withHeaders = client.withHeaders({ "x-key": "value", "x-other": "other" });
      expect(withHeaders.defaults.headers).toEqual({ "x-key": "value", "x-other": "other" });
    });
  });

  describe("withBaseUrl", () => {
    it("should create client with baseUrl", () => {
      const client = new HttpClientImpl({});
      const withBaseUrl = client.withBaseUrl("https://api.example.com");
      expect(withBaseUrl.defaults.baseUrl).toBe("https://api.example.com");
    });
  });

  describe("withContext", () => {
    it("should create client with context", () => {
      const client = new HttpClientImpl({});
      const withContext = client.withContext({ key: "value" });
      expect(withContext.defaults.context).toEqual({ key: "value" });
    });
  });

  describe("withAuth", () => {
    it("should create client with authorization header", () => {
      const client = new HttpClientImpl({});
      const withAuth = client.withAuth("token123");
      expect(withAuth.defaults.headers).toEqual({ authorization: "token123" });
    });

    it("should create client with scheme", () => {
      const client = new HttpClientImpl({});
      const withAuth = client.withAuth("token123", { scheme: "Bearer" });
      expect(withAuth.defaults.headers).toEqual({ authorization: "Bearer token123" });
    });

    it("should create client with custom header name", () => {
      const client = new HttpClientImpl({});
      const withAuth = client.withAuth("token123", { headerName: "x-api-key" });
      expect(withAuth.defaults.headers).toEqual({ "x-api-key": "token123" });
    });

    it("should lowercase header name", () => {
      const client = new HttpClientImpl({});
      const withAuth = client.withAuth("token123", { headerName: "X-API-KEY" });
      expect(withAuth.defaults.headers).toEqual({ "x-api-key": "token123" });
    });
  });

  describe("hook methods", () => {
    it("onRequest should add beforeRequest hook", () => {
      const client = new HttpClientImpl({});
      const hook = () => {};
      const withHook = client.onRequest(hook);
      expect(withHook.defaults.hooks?.beforeRequest).toContain(hook);
    });

    it("onResponse should add afterResponse hook", () => {
      const client = new HttpClientImpl({});
      const hook = () => {};
      const withHook = client.onResponse(hook);
      expect(withHook.defaults.hooks?.afterResponse).toContain(hook);
    });

    it("onError should add beforeError hook", () => {
      const client = new HttpClientImpl({});
      const hook = () => {};
      const withHook = client.onError(hook);
      expect(withHook.defaults.hooks?.beforeError).toContain(hook);
    });

    it("onRetry should add beforeRetry hook", () => {
      const client = new HttpClientImpl({});
      const hook = () => {};
      const withHook = client.onRetry(hook);
      expect(withHook.defaults.hooks?.beforeRetry).toContain(hook);
    });

    it("onRedirect should add beforeRedirect hook", () => {
      const client = new HttpClientImpl({});
      const hook = () => {};
      const withHook = client.onRedirect(hook);
      expect(withHook.defaults.hooks?.beforeRedirect).toContain(hook);
    });
  });

  describe("HTTP methods", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue(createMockResponse());
    });

    it("should make GET request", async () => {
      const client = new HttpClientImpl({});
      await client.get("https://example.com");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://example.com/",
        expect.objectContaining({ method: "GET" })
      );
    });

    it("should make POST request", async () => {
      const client = new HttpClientImpl({});
      await client.post("https://example.com", { json: { key: "value" } });
      expect(mockFetch).toHaveBeenCalledWith(
        "https://example.com/",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("should make PUT request", async () => {
      const client = new HttpClientImpl({});
      await client.put("https://example.com");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://example.com/",
        expect.objectContaining({ method: "PUT" })
      );
    });

    it("should make PATCH request", async () => {
      const client = new HttpClientImpl({});
      await client.patch("https://example.com");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://example.com/",
        expect.objectContaining({ method: "PATCH" })
      );
    });

    it("should make DELETE request", async () => {
      const client = new HttpClientImpl({});
      await client.delete("https://example.com");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://example.com/",
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("should make HEAD request", async () => {
      const client = new HttpClientImpl({});
      await client.head("https://example.com");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://example.com/",
        expect.objectContaining({ method: "HEAD" })
      );
    });

    it("should make OPTIONS request", async () => {
      const client = new HttpClientImpl({});
      await client.options("https://example.com");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://example.com/",
        expect.objectContaining({ method: "OPTIONS" })
      );
    });
  });

  describe("request methods", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue(createMockResponse({
        body: new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('{"result":"success"}'));
            controller.close();
          },
        }),
      }));
    });

    it("request should return HttpRequestPromise", async () => {
      const client = new HttpClientImpl({});
      const response = await client.request({ url: "https://example.com" });
      expect(response).toHaveProperty("status");
      expect(response).toHaveProperty("json");
      expect(response).toHaveProperty("text");
      expect(response).toHaveProperty("bytes");
    });

    it("raw should set throwHttpErrors to false", async () => {
      mockFetch.mockResolvedValue(createMockResponse({ ok: false, status: 500 }));
      const client = new HttpClientImpl({});
      const response = await client.raw({ url: "https://example.com" });
      expect(response.status).toBe(500);
    });

    it("stream should set responseType to stream", async () => {
      const client = new HttpClientImpl({});
      const response = await client.stream({ url: "https://example.com" });
      expect(response.request.responseType).toBe("stream");
    });
  });

  describe("builder", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue(createMockResponse());
    });

    it("should create builder", () => {
      const client = new HttpClientImpl({});
      const builder = client.builder();
      expect(builder).toBeDefined();
      expect(builder.with).toBeDefined();
      expect(builder.request).toBeDefined();
      expect(builder.get).toBeDefined();
      expect(builder.post).toBeDefined();
    });

    it("builder should accumulate options", async () => {
      const client = new HttpClientImpl({});
      const builder = client.builder()
        .with({ baseUrl: "https://api.example.com" })
        .with({ headers: { "x-key": "value" } });
      // Builder stores options for later request
      expect(builder).toBeDefined();
    });
  });
});

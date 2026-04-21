import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { executeRequest } from "../execute.js";
import { HTTPStatusError } from "../../errors/http-status-error.js";
import { NetworkError } from "../../errors/network-error.js";
import { AbortError } from "../../errors/abort-error.js";
import { RetryError } from "../../errors/retry-error.js";
import { RedirectError } from "../../errors/redirect-error.js";
import type { NormalizedRequestOptions } from "../../types/internal.js";
import type { HttpAdapter, AdapterResponse } from "../../types/adapter.js";

describe("executeRequest", () => {
  let mockAdapter: HttpAdapter;

  beforeEach(() => {
    mockAdapter = {
      name: "mock",
      supports: {
        stream: true,
        uploadProgress: false,
        downloadProgress: false,
        cookies: false,
        proxy: false,
      },
      execute: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createRequest = (
    overrides: Partial<NormalizedRequestOptions> = {}
  ): NormalizedRequestOptions => ({
    method: "GET",
    url: "https://example.com",
    headers: {},
    body: { kind: "none" },
    searchParamsApplied: false,
    timeout: {},
    retry: {
      limit: 0,
      methods: ["GET"],
      statusCodes: [],
      errorCodes: [],
      calculateDelay: undefined,
    },
    redirect: {
      follow: true,
      max: 10,
      keepMethod: false,
      strictOrigin: false,
      stripSensitiveHeaders: true,
    },
    responseType: "bytes",
    decompress: true,
    throwHttpErrors: true,
    signal: undefined,
    hooks: {
      init: [],
      beforeRequest: [],
      beforeRedirect: [],
      beforeRetry: [],
      afterResponse: [],
      beforeError: [],
    },
    context: {},
    adapter: undefined,
    baseUrl: undefined,
    tracing: {
      errorBodyPreviewBytes: 1024,
    },
    ...overrides,
  });

  const createAdapterResponse = (
    overrides: Partial<AdapterResponse> = {}
  ): AdapterResponse => ({
    url: "https://example.com",
    status: 200,
    statusText: "OK",
    ok: true,
    headers: new Headers(),
    body: null,
    timings: { response: 100 },
    ...overrides,
  });

  describe("basic requests", () => {
    it("should execute successful request", async () => {
      const normalized = createRequest();
      const adapterResponse = createAdapterResponse();
      mockAdapter.execute.mockResolvedValue(adapterResponse);

      const result = await executeRequest({
        plain: {},
        normalized,
        defaultAdapter: mockAdapter,
      });

      expect(result.status).toBe(200);
      expect(result.ok).toBe(true);
    });

    it("should include request info in response", async () => {
      const normalized = createRequest({ url: "https://api.example.com/users" });
      const adapterResponse = createAdapterResponse();
      mockAdapter.execute.mockResolvedValue(adapterResponse);

      const result = await executeRequest({
        plain: {},
        normalized,
        defaultAdapter: mockAdapter,
      });

      expect(result.request.url).toBe("https://api.example.com/users");
      expect(result.request.method).toBe("GET");
    });

    it("should pass headers to adapter", async () => {
      const normalized = createRequest({
        headers: { "x-api-key": "secret", "accept": "application/json" },
      });
      mockAdapter.execute.mockResolvedValue(createAdapterResponse());

      await executeRequest({
        plain: {},
        normalized,
        defaultAdapter: mockAdapter,
      });

      expect(mockAdapter.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            "x-api-key": "secret",
            "accept": "application/json",
          }),
        }),
        expect.any(Object)
      );
    });

    it("should use custom adapter when provided", async () => {
      const customAdapter: HttpAdapter = {
        ...mockAdapter,
        name: "custom",
        execute: vi.fn().mockResolvedValue(createAdapterResponse()),
      };

      const normalized = createRequest({ adapter: customAdapter });

      await executeRequest({
        plain: {},
        normalized,
        defaultAdapter: mockAdapter,
      });

      expect(customAdapter.execute).toHaveBeenCalled();
      expect(mockAdapter.execute).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should throw HTTPStatusError for non-2xx when throwHttpErrors is true", async () => {
      const normalized = createRequest({ throwHttpErrors: true });
      mockAdapter.execute.mockResolvedValue(
        createAdapterResponse({
          status: 500,
          statusText: "Internal Server Error",
          ok: false,
          body: new Uint8Array([123, 34, 101, 114, 114, 111, 114, 34, 58, 34, 109, 115, 103, 34, 125]), // {"error":"msg"}
        })
      );

      await expect(
        executeRequest({
          plain: {},
          normalized,
          defaultAdapter: mockAdapter,
        })
      ).rejects.toThrow(HTTPStatusError);
    });

    it("should not throw for non-2xx when throwHttpErrors is false", async () => {
      const normalized = createRequest({ throwHttpErrors: false });
      mockAdapter.execute.mockResolvedValue(
        createAdapterResponse({ status: 500, statusText: "Error", ok: false })
      );

      const result = await executeRequest({
        plain: {},
        normalized,
        defaultAdapter: mockAdapter,
      });

      expect(result.status).toBe(500);
      expect(result.ok).toBe(false);
    });

    it("should throw NetworkError on adapter failure", async () => {
      const normalized = createRequest();
      mockAdapter.execute.mockRejectedValue(new Error("Connection failed"));

      await expect(
        executeRequest({
          plain: {},
          normalized,
          defaultAdapter: mockAdapter,
        })
      ).rejects.toThrow(NetworkError);
    });

    it("should throw AbortError on DOMException abort", async () => {
      const normalized = createRequest();
      const domException = new DOMException("Aborted", "AbortError");
      mockAdapter.execute.mockRejectedValue(domException);

      await expect(
        executeRequest({
          plain: {},
          normalized,
          defaultAdapter: mockAdapter,
        })
      ).rejects.toThrow(AbortError);
    });

    it("should include requestId in error", async () => {
      const normalized = createRequest({
        throwHttpErrors: true,
        tracing: {
          generateRequestId: () => "test-id-123",
          errorBodyPreviewBytes: 1024,
        },
      });

      mockAdapter.execute.mockResolvedValue(
        createAdapterResponse({ status: 500, ok: false, body: new Uint8Array() })
      );

      try {
        await executeRequest({
          plain: {},
          normalized,
          defaultAdapter: mockAdapter,
        });
      } catch (error) {
        expect((error as HTTPStatusError).requestId).toBeDefined();
      }
    });
  });

  describe("retry logic", () => {
    it("should retry on network error when limit > 0", async () => {
      const normalized = createRequest({
        retry: {
          limit: 3,
          methods: ["GET"],
          statusCodes: [],
          errorCodes: [],
          calculateDelay: () => 10,
        },
      });

      mockAdapter.execute
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce(createAdapterResponse());

      const result = await executeRequest({
        plain: {},
        normalized,
        defaultAdapter: mockAdapter,
      });

      expect(result.status).toBe(200);
      expect(mockAdapter.execute).toHaveBeenCalledTimes(3);
    });

    it("should retry on HTTP status error when status code is retryable", async () => {
      const normalized = createRequest({
        retry: {
          limit: 3,
          methods: ["GET"],
          statusCodes: [503],
          errorCodes: [],
          calculateDelay: () => 10,
        },
      });

      mockAdapter.execute
        .mockResolvedValueOnce(createAdapterResponse({ status: 503, ok: false }))
        .mockResolvedValueOnce(createAdapterResponse({ status: 200, ok: true }));

      const result = await executeRequest({
        plain: {},
        normalized,
        defaultAdapter: mockAdapter,
      });

      expect(result.status).toBe(200);
      expect(mockAdapter.execute).toHaveBeenCalledTimes(2);
    });

    it("should throw RetryError when retry limit is exhausted", async () => {
      const normalized = createRequest({
        retry: {
          limit: 2,
          methods: ["GET"],
          statusCodes: [],
          errorCodes: [],
          calculateDelay: () => 10,
        },
      });

      mockAdapter.execute.mockRejectedValue(new Error("Network error"));

      await expect(
        executeRequest({
          plain: {},
          normalized,
          defaultAdapter: mockAdapter,
        })
      ).rejects.toThrow(RetryError);
    });

    it("should include retry count in successful response", async () => {
      const normalized = createRequest({
        retry: {
          limit: 3,
          methods: ["GET"],
          statusCodes: [],
          errorCodes: [],
          calculateDelay: () => 10,
        },
      });

      mockAdapter.execute
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce(createAdapterResponse());

      const result = await executeRequest({
        plain: {},
        normalized,
        defaultAdapter: mockAdapter,
      });

      expect(result.retryCount).toBe(1);
    });
  });

  describe("redirect handling", () => {
    it("should follow redirect when follow is true", async () => {
      const normalized = createRequest({
        redirect: {
          follow: true,
          max: 10,
          keepMethod: false,
          strictOrigin: false,
          stripSensitiveHeaders: true,
        },
      });

      mockAdapter.execute
        .mockResolvedValueOnce(
          createAdapterResponse({
            status: 302,
            headers: new Headers({ location: "https://example.com/redirected" }),
          })
        )
        .mockResolvedValueOnce(createAdapterResponse({ url: "https://example.com/redirected" }));

      const result = await executeRequest({
        plain: {},
        normalized,
        defaultAdapter: mockAdapter,
      });

      expect(result.url).toBe("https://example.com/redirected");
    });

    it("should throw RedirectError when max redirects exceeded", async () => {
      const normalized = createRequest({
        redirect: {
          follow: true,
          max: 2,
          keepMethod: false,
          strictOrigin: false,
          stripSensitiveHeaders: true,
        },
      });

      mockAdapter.execute.mockResolvedValue(
        createAdapterResponse({
          status: 302,
          headers: new Headers({ location: "https://example.com/next" }),
        })
      );

      await expect(
        executeRequest({
          plain: {},
          normalized,
          defaultAdapter: mockAdapter,
        })
      ).rejects.toThrow(RedirectError);
    });

    it("should throw RedirectError on redirect loop", async () => {
      const normalized = createRequest({
        redirect: {
          follow: true,
          max: 10,
          keepMethod: false,
          strictOrigin: false,
          stripSensitiveHeaders: true,
        },
      });

      mockAdapter.execute.mockResolvedValue(
        createAdapterResponse({
          status: 302,
          headers: new Headers({ location: "https://example.com" }), // Same as original URL
        })
      );

      await expect(
        executeRequest({
          plain: {},
          normalized,
          defaultAdapter: mockAdapter,
        })
      ).rejects.toThrow(RedirectError);
    });
  });

  describe("hooks", () => {
    it("should run init hooks", async () => {
      const initHook = vi.fn();
      const normalized = createRequest({
        hooks: {
          init: [initHook],
          beforeRequest: [],
          beforeRedirect: [],
          beforeRetry: [],
          afterResponse: [],
          beforeError: [],
        },
      });

      mockAdapter.execute.mockResolvedValue(createAdapterResponse());

      await executeRequest({
        plain: { url: "https://example.com" },
        normalized,
        defaultAdapter: mockAdapter,
      });

      expect(initHook).toHaveBeenCalledWith(
        expect.objectContaining({ url: "https://example.com" }),
        normalized
      );
    });

    it("should run beforeRequest hooks", async () => {
      const beforeRequestHook = vi.fn();
      const normalized = createRequest({
        hooks: {
          init: [],
          beforeRequest: [beforeRequestHook],
          beforeRedirect: [],
          beforeRetry: [],
          afterResponse: [],
          beforeError: [],
        },
      });

      mockAdapter.execute.mockResolvedValue(createAdapterResponse());

      await executeRequest({
        plain: {},
        normalized,
        defaultAdapter: mockAdapter,
      });

      expect(beforeRequestHook).toHaveBeenCalled();
    });

    it("should run afterResponse hooks", async () => {
      const afterResponseHook = vi.fn().mockResolvedValue(undefined);
      const normalized = createRequest({
        hooks: {
          init: [],
          beforeRequest: [],
          beforeRedirect: [],
          beforeRetry: [],
          afterResponse: [afterResponseHook],
          beforeError: [],
        },
      });

      mockAdapter.execute.mockResolvedValue(createAdapterResponse());

      await executeRequest({
        plain: {},
        normalized,
        defaultAdapter: mockAdapter,
      });

      expect(afterResponseHook).toHaveBeenCalled();
    });

    it("should run beforeError hooks on error", async () => {
      const beforeErrorHook = vi.fn().mockImplementation((ctx) => ctx.error);
      const normalized = createRequest({
        throwHttpErrors: true,
        hooks: {
          init: [],
          beforeRequest: [],
          beforeRedirect: [],
          beforeRetry: [],
          afterResponse: [],
          beforeError: [beforeErrorHook],
        },
      });

      mockAdapter.execute.mockResolvedValue(
        createAdapterResponse({ status: 500, ok: false, body: new Uint8Array() })
      );

      try {
        await executeRequest({
          plain: {},
          normalized,
          defaultAdapter: mockAdapter,
        });
      } catch {
        // Expected
      }

      expect(beforeErrorHook).toHaveBeenCalled();
    });
  });

  describe("abort signal", () => {
    it("should abort when signal is aborted", async () => {
      const controller = new AbortController();
      const normalized = createRequest({ signal: controller.signal });

      mockAdapter.execute.mockImplementation(async () => {
        // Simulate long request
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return createAdapterResponse();
      });

      const requestPromise = executeRequest({
        plain: {},
        normalized,
        defaultAdapter: mockAdapter,
      });

      controller.abort("User cancelled");

      await expect(requestPromise).rejects.toThrow(AbortError);
    });
  });

  describe("tracing", () => {
    it("should inject request id header when configured", async () => {
      const normalized = createRequest({
        headers: {},
        tracing: {
          requestIdHeader: "x-request-id",
          generateRequestId: () => "test-request-id",
          errorBodyPreviewBytes: 1024,
        },
      });

      mockAdapter.execute.mockImplementation(async (request) => {
        expect(request.headers["x-request-id"]).toBe("test-request-id");
        return createAdapterResponse();
      });

      await executeRequest({
        plain: {},
        normalized,
        defaultAdapter: mockAdapter,
      });
    });

    it("should not override existing request id header", async () => {
      const normalized = createRequest({
        headers: { "x-request-id": "existing-id" },
        tracing: {
          requestIdHeader: "x-request-id",
          generateRequestId: () => "new-id",
          errorBodyPreviewBytes: 1024,
        },
      });

      mockAdapter.execute.mockImplementation(async (request) => {
        expect(request.headers["x-request-id"]).toBe("existing-id");
        return createAdapterResponse();
      });

      await executeRequest({
        plain: {},
        normalized,
        defaultAdapter: mockAdapter,
      });
    });
  });
});

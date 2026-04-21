import { describe, it, expect, vi } from "vitest";
import {
  runInitHooks,
  runBeforeRequestHooks,
  runBeforeRedirectHooks,
  runBeforeRetryHooks,
  runAfterResponseHooks,
  runBeforeErrorHooks,
} from "../hooks.js";
import { RequestError } from "../../errors/request-error.js";
import type { HttpHooks } from "../../types/hooks.js";
import type { NormalizedRequestOptions } from "../../types/internal.js";
import type { RequestOptions } from "../../types/public.js";

describe("runInitHooks", () => {
  it("should run all init hooks", () => {
    const hook1 = vi.fn();
    const hook2 = vi.fn();
    const hooks: HttpHooks = {
      init: [hook1, hook2],
      beforeRequest: [],
      beforeRedirect: [],
      beforeRetry: [],
      afterResponse: [],
      beforeError: [],
    };
    const plain = {} as RequestOptions;
    const normalized = {} as NormalizedRequestOptions;

    runInitHooks(hooks, plain, normalized);

    expect(hook1).toHaveBeenCalledWith(plain, normalized);
    expect(hook2).toHaveBeenCalledWith(plain, normalized);
  });

  it("should throw RequestError when hook throws", async () => {
    const hooks: HttpHooks = {
      init: [() => { throw new Error("hook error"); }],
      beforeRequest: [],
      beforeRedirect: [],
      beforeRetry: [],
      afterResponse: [],
      beforeError: [],
    };

    await expect(runInitHooks(hooks, {} as RequestOptions, {} as NormalizedRequestOptions))
      .rejects.toThrow(RequestError);
  });

  it("should include phase in error message", async () => {
    const hooks: HttpHooks = {
      init: [() => { throw new Error("hook error"); }],
      beforeRequest: [],
      beforeRedirect: [],
      beforeRetry: [],
      afterResponse: [],
      beforeError: [],
    };

    await expect(runInitHooks(hooks, {} as RequestOptions, {} as NormalizedRequestOptions))
      .rejects.toThrow("Hook failure (init)");
  });

});

describe("runBeforeRequestHooks", () => {
  it("should run all beforeRequest hooks", async () => {
    const hook1 = vi.fn();
    const hook2 = vi.fn();
    const hooks: HttpHooks = {
      init: [],
      beforeRequest: [hook1, hook2],
      beforeRedirect: [],
      beforeRetry: [],
      afterResponse: [],
      beforeError: [],
    };
    const ctx = {
      plain: {} as RequestOptions,
      normalized: {} as NormalizedRequestOptions,
      signal: undefined,
      context: {},
    };

    await runBeforeRequestHooks(hooks, ctx);

    expect(hook1).toHaveBeenCalledWith(ctx);
    expect(hook2).toHaveBeenCalledWith(ctx);
  });

  it("should await async hooks", async () => {
    const asyncHook = vi.fn().mockResolvedValue(undefined);
    const hooks: HttpHooks = {
      init: [],
      beforeRequest: [asyncHook],
      beforeRedirect: [],
      beforeRetry: [],
      afterResponse: [],
      beforeError: [],
    };

    await runBeforeRequestHooks(hooks, {
      plain: {} as RequestOptions,
      normalized: {} as NormalizedRequestOptions,
      signal: undefined,
      context: {},
    });

    expect(asyncHook).toHaveBeenCalled();
  });

  it("should throw RequestError when hook throws", async () => {
    const hooks: HttpHooks = {
      init: [],
      beforeRequest: [() => { throw new Error("hook error"); }],
      beforeRedirect: [],
      beforeRetry: [],
      afterResponse: [],
      beforeError: [],
    };

    await expect(runBeforeRequestHooks(hooks, {
      plain: {} as RequestOptions,
      normalized: {} as NormalizedRequestOptions,
      signal: undefined,
      context: {},
    })).rejects.toThrow(RequestError);
  });
});

describe("runBeforeRedirectHooks", () => {
  it("should run all beforeRedirect hooks", async () => {
    const hook = vi.fn();
    const hooks: HttpHooks = {
      init: [],
      beforeRequest: [],
      beforeRedirect: [hook],
      beforeRetry: [],
      afterResponse: [],
      beforeError: [],
    };
    const ctx = {
      from: {} as NormalizedRequestOptions,
      toUrl: "https://example.com",
      status: 302,
      redirectIndex: 0,
      context: {},
    };

    await runBeforeRedirectHooks(hooks, ctx);

    expect(hook).toHaveBeenCalledWith(ctx);
  });

  it("should throw RequestError when hook throws", async () => {
    const hooks: HttpHooks = {
      init: [],
      beforeRequest: [],
      beforeRedirect: [() => { throw new Error("hook error"); }],
      beforeRetry: [],
      afterResponse: [],
      beforeError: [],
    };

    await expect(runBeforeRedirectHooks(hooks, {
      from: {} as NormalizedRequestOptions,
      toUrl: "https://example.com",
      status: 302,
      redirectIndex: 0,
      context: {},
    })).rejects.toThrow(RequestError);
  });
});

describe("runBeforeRetryHooks", () => {
  it("should run all beforeRetry hooks", async () => {
    const hook = vi.fn();
    const hooks: HttpHooks = {
      init: [],
      beforeRequest: [],
      beforeRedirect: [],
      beforeRetry: [hook],
      afterResponse: [],
      beforeError: [],
    };
    const ctx = {
      error: new Error("failed"),
      attempt: 1,
      retryCount: 0,
      normalized: {} as NormalizedRequestOptions,
      context: {},
    };

    await runBeforeRetryHooks(hooks, ctx);

    expect(hook).toHaveBeenCalledWith(ctx);
  });

  it("should throw RequestError when hook throws", async () => {
    const hooks: HttpHooks = {
      init: [],
      beforeRequest: [],
      beforeRedirect: [],
      beforeRetry: [() => { throw new Error("hook error"); }],
      afterResponse: [],
      beforeError: [],
    };

    await expect(runBeforeRetryHooks(hooks, {
      error: new Error("failed"),
      attempt: 1,
      retryCount: 0,
      normalized: {} as NormalizedRequestOptions,
      context: {},
    })).rejects.toThrow(RequestError);
  });
});

describe("runAfterResponseHooks", () => {
  it("should run all afterResponse hooks and return response", async () => {
    const hook = vi.fn().mockResolvedValue(undefined);
    const hooks: HttpHooks = {
      init: [],
      beforeRequest: [],
      beforeRedirect: [],
      beforeRetry: [],
      afterResponse: [hook],
      beforeError: [],
    };
    const mockResponse = { status: 200 } as any;
    const ctx = {
      response: mockResponse,
      normalized: {} as NormalizedRequestOptions,
      context: {},
    };

    const result = await runAfterResponseHooks(hooks, ctx);

    expect(hook).toHaveBeenCalledWith({ ...ctx, response: mockResponse });
    expect(result.response).toBe(mockResponse);
  });


  it("should handle retry directive", async () => {
    const hooks: HttpHooks = {
      init: [],
      beforeRequest: [],
      beforeRedirect: [],
      beforeRetry: [],
      afterResponse: [() => ({ kind: "retry" as const, delayMs: 1000 })],
      beforeError: [],
    };

    const result = await runAfterResponseHooks(hooks, {
      response: { status: 200 } as any,
      normalized: {} as NormalizedRequestOptions,
      context: {},
    });

    expect(result.retry).toEqual({ delayMs: 1000 });
  });

  it("should throw RequestError when hook throws", async () => {
    const hooks: HttpHooks = {
      init: [],
      beforeRequest: [],
      beforeRedirect: [],
      beforeRetry: [],
      afterResponse: [() => { throw new Error("hook error"); }],
      beforeError: [],
    };

    await expect(runAfterResponseHooks(hooks, {
      response: { status: 200 } as any,
      normalized: {} as NormalizedRequestOptions,
      context: {},
    })).rejects.toThrow(RequestError);
  });
});

describe("runBeforeErrorHooks", () => {
  it("should run all beforeError hooks and return error", async () => {
    const hook = vi.fn().mockImplementation((_ctx) => new Error("modified error"));
    const hooks: HttpHooks = {
      init: [],
      beforeRequest: [],
      beforeRedirect: [],
      beforeRetry: [],
      afterResponse: [],
      beforeError: [hook],
    };
    const originalError = new Error("original");
    const ctx = {
      error: originalError,
      normalized: {} as NormalizedRequestOptions,
      context: {},
    };

    const result = await runBeforeErrorHooks(hooks, ctx);

    expect(hook).toHaveBeenCalledWith({ ...ctx, error: originalError });
    expect(result.message).toBe("modified error");
  });

  it("should pass modified error to next hook", async () => {
    const error1 = new Error("error 1");
    const error2 = new Error("error 2");

    const hook1 = vi.fn().mockResolvedValue(error1);
    const hook2 = vi.fn().mockImplementation((ctx) => {
      expect(ctx.error).toBe(error1);
      return error2;
    });

    const hooks: HttpHooks = {
      init: [],
      beforeRequest: [],
      beforeRedirect: [],
      beforeRetry: [],
      afterResponse: [],
      beforeError: [hook1, hook2],
    };

    const result = await runBeforeErrorHooks(hooks, {
      error: new Error("original"),
      normalized: {} as NormalizedRequestOptions,
      context: {},
    });

    expect(result).toBe(error2);
  });

  it("should wrap non-Error return value in Error", async () => {
    const hooks: HttpHooks = {
      init: [],
      beforeRequest: [],
      beforeRedirect: [],
      beforeRetry: [],
      afterResponse: [],
      beforeError: [() => "string error"],
    };

    const result = await runBeforeErrorHooks(hooks, {
      error: new Error("original"),
      normalized: {} as NormalizedRequestOptions,
      context: {},
    });

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("string error");
  });

  it("should throw RequestError when hook throws", async () => {
    const hooks: HttpHooks = {
      init: [],
      beforeRequest: [],
      beforeRedirect: [],
      beforeRetry: [],
      afterResponse: [],
      beforeError: [() => { throw new Error("hook error"); }],
    };

    await expect(runBeforeErrorHooks(hooks, {
      error: new Error("original"),
      normalized: {} as NormalizedRequestOptions,
      context: {},
    })).rejects.toThrow(RequestError);
  });
});

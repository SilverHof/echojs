import { RequestError } from "../errors/request-error.js";
import type { AfterResponseHookResult, HttpHooks } from "../types/hooks.js";
import type { NormalizedRequestOptions } from "../types/internal.js";
import type { RequestOptions } from "../types/public.js";
import { isAfterResponseRetryDirective } from "../utils/is.js";
import { httpResponseFromResponseLike } from "./response.js";

function wrapHookError(phase: string, cause: unknown): never {
  const message = cause instanceof Error ? cause.message : String(cause);
  throw new RequestError(`Hook failure (${phase}): ${message}`, { cause });
}

export async function runInitHooks(
  hooks: HttpHooks,
  plain: Readonly<RequestOptions>,
  normalized: Readonly<NormalizedRequestOptions>,
): Promise<void> {
  for (const fn of hooks.init) {
    try {
      fn(plain, normalized);
    } catch (cause) {
      wrapHookError("init", cause);
    }
  }
}

export async function runBeforeRequestHooks(
  hooks: HttpHooks,
  ctx: import("../types/hooks.js").BeforeRequestContext,
): Promise<void> {
  for (const fn of hooks.beforeRequest) {
    try {
      await fn(ctx);
    } catch (cause) {
      wrapHookError("beforeRequest", cause);
    }
  }
}

export async function runBeforeRedirectHooks(
  hooks: HttpHooks,
  ctx: import("../types/hooks.js").BeforeRedirectContext,
): Promise<void> {
  for (const fn of hooks.beforeRedirect) {
    try {
      await fn(ctx);
    } catch (cause) {
      wrapHookError("beforeRedirect", cause);
    }
  }
}

export async function runBeforeRetryHooks(
  hooks: HttpHooks,
  ctx: import("../types/hooks.js").BeforeRetryContext,
): Promise<void> {
  for (const fn of hooks.beforeRetry) {
    try {
      await fn(ctx);
    } catch (cause) {
      wrapHookError("beforeRetry", cause);
    }
  }
}

export async function runAfterResponseHooks(
  hooks: HttpHooks,
  ctx: import("../types/hooks.js").AfterResponseContext,
): Promise<{ response: import("../types/response.js").HttpResponse<unknown>; retry?: { delayMs?: number } }> {
  let current = ctx.response;
  for (const fn of hooks.afterResponse) {
    let result: AfterResponseHookResult;
    try {
      result = await fn({ ...ctx, response: current });
    } catch (cause) {
      wrapHookError("afterResponse", cause);
    }
    if (result === undefined) continue;
    if (isAfterResponseRetryDirective(result)) {
      return { response: current, retry: { delayMs: result.delayMs } };
    }
    // ResponseLike
    current = await httpResponseFromResponseLike(result, ctx.normalized, ctx.response.retryCount);
  }
  return { response: current };
}

export async function runBeforeErrorHooks(
  hooks: HttpHooks,
  ctx: import("../types/hooks.js").BeforeErrorContext,
): Promise<Error> {
  let err: unknown = ctx.error;
  for (const fn of hooks.beforeError) {
    try {
      err = await fn({ ...ctx, error: err });
    } catch (cause) {
      wrapHookError("beforeError", cause);
    }
  }
  return err instanceof Error ? err : new Error(String(err));
}

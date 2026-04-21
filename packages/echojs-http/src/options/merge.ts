import type { HttpHooks } from "../types/hooks.js";
import type { RequestOptions } from "../types/public.js";
import { mergeHeaders } from "../utils/headers.js";
import { mergeRecord } from "../utils/merge.js";
import { EMPTY_HOOKS } from "./defaults.js";

function mergeHookBuckets(
  aHook: RequestOptions["hooks"] | undefined,
  bHook: RequestOptions["hooks"] | undefined,
): HttpHooks {
  return {
    init: [...(aHook?.init ?? []), ...(bHook?.init ?? [])],
    beforeRequest: [...(aHook?.beforeRequest ?? []), ...(bHook?.beforeRequest ?? [])],
    beforeRedirect: [...(aHook?.beforeRedirect ?? []), ...(bHook?.beforeRedirect ?? [])],
    beforeRetry: [...(aHook?.beforeRetry ?? []), ...(bHook?.beforeRetry ?? [])],
    afterResponse: [...(aHook?.afterResponse   ?? []), ...(bHook?.afterResponse ?? [])],
    beforeError: [...(aHook?.beforeError ?? []), ...(bHook?.beforeError ?? [])],
  };
}

/**
 * Explicit merge strategy:
 * - Scalars: `child` wins when defined
 * - `headers`: merged with `child` overriding keys
 * - Nested buckets (`timeout`, `retry`, `redirect`): shallow-merge with `child` winning
 * - `hooks`: arrays concatenate in `[parent..., child...]` order
 * - `context`: shallow merge with `child` winning
 */
export function mergeRequestOptions(parent: Readonly<RequestOptions>, child: Readonly<RequestOptions>): RequestOptions {
  const hooks = mergeHookBuckets(parent.hooks, child.hooks);
  return {
    method: child.method ?? parent.method,
    url: child.url ?? parent.url,
    baseUrl: child.baseUrl ?? parent.baseUrl,
    headers: mergeHeaders(parent.headers, child.headers),
    searchParams: child.searchParams ?? parent.searchParams,
    body: child.body ?? parent.body,
    json: child.json ?? parent.json,
    form: child.form ?? parent.form,
    timeout: { ...parent.timeout, ...child.timeout },
    retry: { ...parent.retry, ...child.retry },
    redirect: { ...parent.redirect, ...child.redirect },
    responseType: child.responseType ?? parent.responseType,
    decompress: child.decompress ?? parent.decompress,
    throwHttpErrors: child.throwHttpErrors ?? parent.throwHttpErrors,
    signal: child.signal ?? parent.signal,
    hooks: hooks as unknown as RequestOptions["hooks"],
    context: mergeRecord(parent.context ?? {}, child.context ?? {}) as Record<string, unknown>,
    adapter: child.adapter ?? parent.adapter,
  };
}

export function freezeHooks(hooks: HttpHooks): HttpHooks {
  // Ensure stable empty reference when nothing configured
  if (
    hooks.init.length === 0 &&
    hooks.beforeRequest.length === 0 &&
    hooks.beforeRedirect.length === 0 &&
    hooks.beforeRetry.length === 0 &&
    hooks.afterResponse.length === 0 &&
    hooks.beforeError.length === 0
  ) {
    return EMPTY_HOOKS;
  }
  return hooks;
}

import type { NormalizedRequestOptions } from "./internal.js";
import type { RequestOptions } from "./public.js";
import type { HttpResponse } from "./response.js";

/**
 * Minimal response shape hooks may return to replace the upstream result.
 */
export interface ResponseLike {
  readonly url: string;
  readonly status: number;
  readonly statusText: string;
  readonly ok: boolean;
  readonly headers: Headers;
  readonly body: ReadableStream<Uint8Array> | null;
  clone(): ResponseLike;
}

export interface BeforeRequestContext {
  readonly plain: Readonly<RequestOptions>;
  readonly normalized: Readonly<NormalizedRequestOptions>;
  readonly signal: AbortSignal | undefined;
  readonly context: Record<string, unknown>;
}

export interface BeforeRedirectContext {
  readonly from: Readonly<NormalizedRequestOptions>;
  readonly toUrl: string;
  readonly status: number;
  readonly redirectIndex: number;
  readonly context: Record<string, unknown>;
}

export interface BeforeRetryContext {
  readonly error: unknown;
  readonly attempt: number;
  readonly retryCount: number;
  readonly normalized: Readonly<NormalizedRequestOptions>;
  readonly context: Record<string, unknown>;
}

export interface AfterResponseContext {
  readonly response: HttpResponse<unknown>;
  readonly normalized: Readonly<NormalizedRequestOptions>;
  readonly context: Record<string, unknown>;
}

export interface BeforeErrorContext {
  readonly error: unknown;
  readonly normalized: Readonly<NormalizedRequestOptions> | undefined;
  readonly context: Record<string, unknown>;
}

/**
 * Directive returned from `afterResponse` to request a controlled retry.
 */
export interface AfterResponseRetryDirective {
  readonly kind: "retry";
  readonly delayMs?: number | undefined;
}

export type AfterResponseHookResult =
  | ResponseLike
  | AfterResponseRetryDirective
  | void
  | undefined;

/**
 * Production-style hook buckets. Arrays are concatenated on `extend()`.
 */
export interface HttpHooks {
  init: Array<
    (plain: Readonly<RequestOptions>, normalized: Readonly<NormalizedRequestOptions>) => void
  >;
  beforeRequest: Array<(ctx: BeforeRequestContext) => void | Promise<void>>;
  beforeRedirect: Array<(ctx: BeforeRedirectContext) => void | Promise<void>>;
  beforeRetry: Array<(ctx: BeforeRetryContext) => void | Promise<void>>;
  afterResponse: Array<
    (ctx: AfterResponseContext) => AfterResponseHookResult | Promise<AfterResponseHookResult>
  >;
  beforeError: Array<(ctx: BeforeErrorContext) => Error | Promise<Error>>;
}

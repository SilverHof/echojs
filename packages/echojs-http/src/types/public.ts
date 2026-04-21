import type { HttpAdapter } from "./adapter";
import type { HttpHooks } from "./hooks";

/**
 * Supported HTTP verbs for {@link RequestOptions.method}.
 */
export type HttpMethod =
  | "GET"
  | "HEAD"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "OPTIONS";

/**
 * HTTP method as accepted by user options (normalized to uppercase internally).
 */
export type HttpMethodInput = HttpMethod | Lowercase<HttpMethod>;

/**
 * Header bag accepted by the public API (Fetch-compatible plus plain records).
 */
export type HeadersInitLike =
  | Headers
  | Record<string, string | undefined | null>
  | Iterable<readonly [string, string]>;

/**
 * Query/search params accepted by the public API.
 */
export type SearchParamsInitLike =
  | string
  | URLSearchParams
  | Record<string, string | number | boolean | null | undefined>
  | ReadonlyArray<readonly [string, string]>;

/**
 * Raw body accepted by the public API.
 */
export type BodyInitLike =
  | string
  | ArrayBuffer
  | Uint8Array
  | DataView
  | Blob
  | FormData
  | URLSearchParams
  | ReadableStream<Uint8Array>;

/**
 * User-facing request options (object-first API).
 */
export interface RequestOptions {
  method?: HttpMethodInput;
  url?: string | URL;
  baseUrl?: string | URL;
  headers?: HeadersInitLike;
  searchParams?: SearchParamsInitLike;
  body?: BodyInitLike;
  json?: unknown;
  form?: Record<string, unknown> | URLSearchParams;
  timeout?: {
    request?: number;
    response?: number;
    read?: number;
  };
  retry?: {
    limit?: number;
    methods?: HttpMethodInput[];
    statusCodes?: number[];
    errorCodes?: string[];
    calculateDelay?: (ctx: RetryContext) => number;
  };
  redirect?: {
    follow?: boolean;
    max?: number;
    keepMethod?: boolean;
    strictOrigin?: boolean;
    stripSensitiveHeaders?: boolean;
  };
  responseType?: "json" | "text" | "bytes" | "stream";
  decompress?: boolean;
  throwHttpErrors?: boolean;
  signal?: AbortSignal | null;
  hooks?: Partial<HttpHooks>;
  context?: Record<string, unknown>;
  adapter?: HttpAdapter;

  /**
   * Observability / tracing configuration (best-effort and adapter-aware).
   */
  tracing?: {
    /**
     * When set, `@echojs/http` will generate a per-request id and inject it into request headers
     * unless the header already exists.
     */
    requestIdHeader?: string;
    /**
     * Override request id generation.
     */
    generateRequestId?: () => string;
    /**
     * Max bytes to capture into error previews when available.
     * Default: 1024.
     */
    errorBodyPreviewBytes?: number;
  };
}

/**
 * Context passed to {@link RequestOptions.retry.calculateDelay}.
 */
export interface RetryContext {
  attempt: number;
  retryCount: number;
  error: unknown;
  request: import("./internal").NormalizedRequestOptions;
  response?: import("./response").HttpResponse<unknown>;
}

/**
 * Immutable snapshot of defaults used by a client instance.
 */
export type HttpClientDefaults = Readonly<RequestOptions>;

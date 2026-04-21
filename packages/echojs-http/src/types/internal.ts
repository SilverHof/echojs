import type { HttpAdapter } from "./adapter.js";
import type { HttpHooks } from "./hooks.js";
import type { HttpMethod } from "./public.js";

/**
 * Serialized / normalized request body representation for adapters.
 */
export type NormalizedBody =
  | { kind: "none" }
  | { kind: "raw"; body: import("./public.js").BodyInitLike }
  | { kind: "bytes"; data: Uint8Array; contentType?: string | undefined }
  | { kind: "text"; data: string; contentType?: string | undefined }
  | { kind: "json"; data: string; contentType: string }
  | { kind: "form"; data: URLSearchParams; contentType: string };

/**
 * Fully normalized options consumed by the execution pipeline and adapters.
 */
export interface NormalizedRequestOptions {
  method: HttpMethod;
  url: string;
  headers: Readonly<Record<string, string>>;
  body: NormalizedBody;
  searchParamsApplied: boolean;
  timeout: {
    request?: number | undefined;
    response?: number | undefined;
    read?: number | undefined;
  };
  retry: {
    limit: number;
    methods: HttpMethod[] | undefined;
    statusCodes: number[] | undefined;
    errorCodes: string[] | undefined;
    calculateDelay: ((ctx: import("./public.js").RetryContext) => number) | undefined;
  };
  redirect: {
    follow: boolean;
    max: number;
    keepMethod: boolean;
    strictOrigin: boolean;
    stripSensitiveHeaders: boolean;
  };
  responseType: "json" | "text" | "bytes" | "stream";
  decompress: boolean;
  throwHttpErrors: boolean;
  signal: AbortSignal | undefined;
  hooks: HttpHooks;
  context: Record<string, unknown>;
  adapter: HttpAdapter | undefined;
  baseUrl: string | undefined;

  tracing: {
    requestIdHeader?: string | undefined;
    generateRequestId?: (() => string) | undefined;
    errorBodyPreviewBytes: number;
  };
}

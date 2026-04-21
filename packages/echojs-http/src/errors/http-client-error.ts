import type { NormalizedRequestOptions } from "../types/internal.js";
import type { HttpErrorCode } from "../types/errors.js";
import type { HttpResponse } from "../types/response.js";
import type { HttpTimings } from "../types/timings.js";

/**
 * Base error for all failures produced by `@echojs/http`.
 */
export class HttpClientError extends Error {
  override readonly cause?: unknown;
  readonly code: HttpErrorCode;
  readonly request?: Readonly<NormalizedRequestOptions> | undefined;
  readonly response?: HttpResponse<unknown> | undefined;
  readonly timings?: HttpTimings | undefined;
  readonly retryCount: number;
  readonly context: Readonly<Record<string, unknown>>;
  readonly requestId?: string | undefined;
  readonly method?: string | undefined;
  readonly url?: string | undefined;
  readonly status?: number | undefined;
  readonly headers?: Readonly<Record<string, string>> | undefined;
  readonly responseBodyPreview?: string | undefined;

  constructor(
    message: string,
    opts: {
      code: HttpErrorCode;
      cause?: unknown;
      request?: Readonly<NormalizedRequestOptions>;
      response?: HttpResponse<unknown>;
      timings?: HttpTimings;
      retryCount?: number;
      context?: Record<string, unknown>;
      requestId?: string;
      method?: string;
      url?: string;
      status?: number;
      headers?: Record<string, string>;
      responseBodyPreview?: string;
    },
  ) {
    super(message, opts.cause !== undefined ? { cause: opts.cause } : undefined);
    this.name = new.target.name;
    this.code = opts.code;
    this.request = opts.request;
    this.response = opts.response;
    this.timings = opts.timings;
    this.retryCount = opts.retryCount ?? 0;
    this.context = Object.freeze({ ...opts.context });
    this.requestId = opts.requestId;
    this.method = opts.method ?? opts.request?.method;
    this.url = opts.url ?? opts.request?.url;
    this.status = opts.status ?? opts.response?.status;
    this.headers = opts.headers ? Object.freeze({ ...opts.headers }) : undefined;
    this.responseBodyPreview = opts.responseBodyPreview;
    if (opts.cause !== undefined) {
      (this as { cause?: unknown }).cause = opts.cause;
    }
  }
}

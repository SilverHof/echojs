import type { NormalizedRequestOptions } from "../types/internal.js";
import type { HttpTimings } from "../types/timings.js";
import { HttpClientError } from "./http-client-error.js";

/** Retry budget exhausted or retry policy declined to continue. */
export class RetryError extends HttpClientError {
  readonly lastError: unknown;

  constructor(
    message: string,
    opts: {
      lastError: unknown;
      request?: Readonly<NormalizedRequestOptions>;
      timings?: HttpTimings;
      retryCount?: number;
      context?: Record<string, unknown>;
      cause?: unknown;
    },
  ) {
    super(message, { ...opts, code: "ERR_RETRY", cause: opts.cause ?? opts.lastError });
    this.lastError = opts.lastError;
  }
}

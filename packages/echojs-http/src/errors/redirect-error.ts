import type { NormalizedRequestOptions } from "../types/internal.js";
import type { HttpTimings } from "../types/timings.js";
import { HttpClientError } from "./http-client-error.js";

/** Too many redirects, loop detected, or policy blocked navigation. */
export class RedirectError extends HttpClientError {
  readonly redirectCount: number;
  readonly lastLocation: string | undefined;

  constructor(
    message: string,
    opts: {
      redirectCount: number;
      lastLocation?: string | undefined;
      request?: Readonly<NormalizedRequestOptions>;
      timings?: HttpTimings;
      retryCount?: number;
      context?: Record<string, unknown>;
      cause?: unknown;
    },
  ) {
    super(message, { ...opts, code: "ERR_REDIRECT" });
    this.redirectCount = opts.redirectCount;
    this.lastLocation = opts.lastLocation;
  }
}

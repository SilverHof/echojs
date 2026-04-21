import type { NormalizedRequestOptions } from "../types/internal.js";
import type { HttpTimings } from "../types/timings.js";
import { HttpClientError } from "./http-client-error.js";

/** User or cooperative abort via {@link AbortSignal}. */
export class AbortError extends HttpClientError {
  constructor(
    message = "Request aborted",
    opts: {
      cause?: unknown;
      request?: Readonly<NormalizedRequestOptions>;
      timings?: HttpTimings;
      retryCount?: number;
      context?: Record<string, unknown>;
      requestId?: string;
    } = {},
  ) {
    super(message, { ...opts, code: "ERR_ABORT" });
  }
}

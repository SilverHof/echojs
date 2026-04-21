import type { NormalizedRequestOptions } from "../types/internal.js";
import type { HttpTimings } from "../types/timings.js";
import { HttpClientError } from "./http-client-error.js";

/** Malformed options, unsupported combination, or local request preparation failure. */
export class RequestError extends HttpClientError {
  constructor(
    message: string,
    opts: {
      cause?: unknown;
      request?: Readonly<NormalizedRequestOptions>;
      timings?: HttpTimings;
      retryCount?: number;
      context?: Record<string, unknown>;
    } = {},
  ) {
    super(message, { ...opts, code: "ERR_REQUEST" });
  }
}

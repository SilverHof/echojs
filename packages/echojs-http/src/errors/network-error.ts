import type { NormalizedRequestOptions } from "../types/internal.js";
import type { HttpTimings } from "../types/timings.js";
import { HttpClientError } from "./http-client-error.js";

/** Transport-level failure after the request left the client (DNS, TLS, reset, etc.). */
export class NetworkError extends HttpClientError {
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
    super(message, { ...opts, code: "ERR_NETWORK" });
  }
}

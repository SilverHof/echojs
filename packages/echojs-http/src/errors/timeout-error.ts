import type { NormalizedRequestOptions } from "../types/internal.js";
import type { HttpTimings } from "../types/timings.js";
import { HttpClientError } from "./http-client-error.js";

export type TimeoutPhase = "request" | "response" | "read";

/**
 * A timeout phase fired. Adapters may not support all phases natively; see docs.
 */
export class TimeoutError extends HttpClientError {
  readonly phase: TimeoutPhase;

  constructor(
    message: string,
    opts: {
      phase: TimeoutPhase;
      cause?: unknown;
      request?: Readonly<NormalizedRequestOptions>;
      timings?: HttpTimings;
      retryCount?: number;
      context?: Record<string, unknown>;
    },
  ) {
    super(message, { ...opts, code: "ERR_TIMEOUT" });
    this.phase = opts.phase;
  }
}

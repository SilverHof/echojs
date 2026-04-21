import type { NormalizedRequestOptions } from "../types/internal.js";
import type { HttpResponse } from "../types/response.js";
import type { HttpTimings } from "../types/timings.js";
import { HttpClientError } from "./http-client-error.js";

/** Non-2xx response when `throwHttpErrors` is enabled (default). */
export class HTTPStatusError extends HttpClientError {
  declare readonly response: HttpResponse<unknown>;

  constructor(
    message: string,
    opts: {
      response: HttpResponse<unknown>;
      request?: Readonly<NormalizedRequestOptions>;
      timings?: HttpTimings;
      retryCount?: number;
      context?: Record<string, unknown>;
      cause?: unknown;
      requestId?: string;
      responseBodyPreview?: string;
    },
  ) {
    super(message, {
      ...opts,
      code: "ERR_HTTP_STATUS",
      response: opts.response,
    });
    this.response = opts.response;
  }
}

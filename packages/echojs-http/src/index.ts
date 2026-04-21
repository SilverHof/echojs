export { createHttpClient } from "./create-http-client.js";
export type { HttpClient, HttpClientBuilder, HttpRequestPromise } from "./client.js";

export type {
  BodyInitLike,
  HeadersInitLike,
  HttpClientDefaults,
  HttpMethod,
  HttpMethodInput,
  RequestOptions,
  RetryContext,
  SearchParamsInitLike,
} from "./types/public.js";

export type { HttpHooks, ResponseLike, AfterResponseRetryDirective } from "./types/hooks.js";
export type {
  AdapterCapabilities,
  AdapterContext,
  AdapterResponse,
  AdapterTimings,
  HttpAdapter,
} from "./types/adapter.js";
export type { HttpResponse, HttpHeaders } from "./types/response.js";
export type { HttpTimings } from "./types/timings.js";
export type { HttpErrorCode } from "./types/errors.js";
export type { NormalizedRequestOptions } from "./types/internal.js";

export { mergeRequestOptions } from "./options/merge.js";
export { normalizeRequestOptions, mergeAndNormalize } from "./options/normalize.js";
export { validateRequestOptions } from "./options/validate.js";

export { fetchAdapter } from "./adapters/fetch-adapter.js";

export {
  HttpClientError,
  RequestError,
  NetworkError,
  TimeoutError,
  AbortError,
  HTTPStatusError,
  ParseError,
  RetryError,
  RedirectError,
  isAbortError,
  isHttpError,
  isNetworkError,
  isStatusError,
  isTimeoutError,
} from "./errors/index.js";
export type { TimeoutPhase } from "./errors/index.js";

// Intentionally not exporting internal retry control error types.

import type { HttpHooks } from "../types/hooks.js";
import type { HttpMethod } from "../types/public.js";

export const EMPTY_HOOKS: HttpHooks = Object.freeze({
  init: [],
  beforeRequest: [],
  beforeRedirect: [],
  beforeRetry: [],
  afterResponse: [],
  beforeError: [],
});

/** Conservative defaults applied during normalization. */
export const DEFAULT_IDEMPOTENT_METHODS: readonly HttpMethod[] = ["GET", "HEAD", "OPTIONS"];

export const DEFAULT_RETRYABLE_STATUS_CODES: readonly number[] = [
  408, 413, 429, 500, 502, 503, 504,
];

export const DEFAULT_RETRYABLE_ERROR_CODES: readonly string[] = [
  "ECONNRESET",
  "EPIPE",
  "ETIMEDOUT",
  "UND_ERR_CONNECT_TIMEOUT",
];

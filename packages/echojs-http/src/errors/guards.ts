import { AbortError } from "./abort-error.js";
import { HTTPStatusError } from "./http-status-error.js";
import { HttpClientError } from "./http-client-error.js";
import { NetworkError } from "./network-error.js";
import { TimeoutError } from "./timeout-error.js";

export function isHttpError(error: unknown): error is HttpClientError {
  return error instanceof HttpClientError;
}

export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}

export function isAbortError(error: unknown): error is AbortError {
  return error instanceof AbortError;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

export function isStatusError(error: unknown): error is HTTPStatusError {
  return error instanceof HTTPStatusError;
}


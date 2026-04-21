import { HTTPStatusError } from "../errors/http-status-error.js";
import { NetworkError } from "../errors/network-error.js";
import { TimeoutError } from "../errors/timeout-error.js";
import type { NormalizedRequestOptions } from "../types/internal.js";
import type { HttpResponse } from "../types/response.js";
import type { RetryContext } from "../types/public.js";

function getErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

export function isRetryableStatus(status: number, allowed: readonly number[] | undefined): boolean {
  if (allowed === undefined) return false;
  return allowed.includes(status);
}

export function isRetryableErrorCode(code: string | undefined, allowed: readonly string[] | undefined): boolean {
  if (code === undefined || allowed === undefined) return false;
  return allowed.includes(code);
}

export function isRetryableError(error: unknown, allowedCodes: readonly string[] | undefined): boolean {
  if (error instanceof NetworkError) return true;
  if (error instanceof TimeoutError) return true;
  const code = getErrorCode(error);
  return isRetryableErrorCode(code, allowedCodes);
}

export function isRetryableHttpError(
  error: unknown,
  statusCodes: readonly number[] | undefined,
): error is HTTPStatusError {
  if (!(error instanceof HTTPStatusError)) return false;
  return isRetryableStatus(error.response.status, statusCodes);
}

export function shouldRetryAttempt(opts: {
  error: unknown;
  normalized: Readonly<NormalizedRequestOptions>;
  response?: HttpResponse<unknown>;
}): boolean {
  const { error, normalized, response } = opts;
  if (normalized.retry.limit <= 0) return false;

  const methods = normalized.retry.methods;
  if (methods !== undefined && !methods.includes(normalized.method)) {
    return false;
  }

  if (response !== undefined) {
    return isRetryableStatus(response.status, normalized.retry.statusCodes);
  }

  if (isRetryableHttpError(error, normalized.retry.statusCodes)) {
    return true;
  }

  if (error instanceof HTTPStatusError) {
    return isRetryableStatus(error.response.status, normalized.retry.statusCodes);
  }

  return isRetryableError(error, normalized.retry.errorCodes);
}

export function defaultCalculateDelay(ctx: RetryContext): number {
  const base = 250;
  const max = 10_000;
  const exp = Math.min(max, base * 2 ** Math.max(0, ctx.retryCount));
  const jitter = Math.floor(Math.random() * 100);
  return exp + jitter;
}

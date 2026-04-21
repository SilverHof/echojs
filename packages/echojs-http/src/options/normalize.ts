import { buildNormalizedBody } from "../core/body.js";
import { buildUrl } from "../core/url.js";
import type { NormalizedRequestOptions } from "../types/internal.js";
import type { HttpHooks } from "../types/hooks.js";
import type { HttpMethod, HttpMethodInput, RequestOptions } from "../types/public.js";
import { mergeHeaders } from "../utils/headers.js";
import {
  DEFAULT_IDEMPOTENT_METHODS,
  DEFAULT_RETRYABLE_ERROR_CODES,
  DEFAULT_RETRYABLE_STATUS_CODES,
  EMPTY_HOOKS,
} from "./defaults.js";
import { freezeHooks, mergeRequestOptions } from "./merge.js";
import { validateRequestOptions } from "./validate.js";

function upperMethod(m: HttpMethodInput | undefined): HttpMethod {
  return (m ?? "GET").toUpperCase() as HttpMethod;
}

/**
 * Produces a fully normalized model from merged public options.
 */
export function normalizeRequestOptions(plain: Readonly<RequestOptions>): NormalizedRequestOptions {
  validateRequestOptions(plain);
  const method = upperMethod(plain.method);
  const url = buildUrl({
    baseUrl: plain.baseUrl,
    url: plain.url,
    searchParams: plain.searchParams,
  });
  const body = buildNormalizedBody(plain);
  const baseHeaders = mergeHeaders(plain.headers);
  const contentTypeFromBody =
    body.kind === "json" ? body.contentType : body.kind === "form" ? body.contentType : undefined;
  const headers = mergeHeaders(
    contentTypeFromBody && !baseHeaders["content-type"]
      ? { "content-type": contentTypeFromBody }
      : {},
    baseHeaders,
  );

  const timeout = {
    request: plain.timeout?.request,
    response: plain.timeout?.response,
    read: plain.timeout?.read,
  };

  const retry = {
    limit: plain.retry?.limit ?? 0,
    methods:
      plain.retry?.methods?.map((m) => upperMethod(m)) ?? [...DEFAULT_IDEMPOTENT_METHODS],
    statusCodes: plain.retry?.statusCodes ?? [...DEFAULT_RETRYABLE_STATUS_CODES],
    errorCodes: plain.retry?.errorCodes ?? [...DEFAULT_RETRYABLE_ERROR_CODES],
    calculateDelay: plain.retry?.calculateDelay,
  };

  const redirect = {
    follow: plain.redirect?.follow ?? true,
    max: plain.redirect?.max ?? 10,
    keepMethod: plain.redirect?.keepMethod ?? false,
    strictOrigin: plain.redirect?.strictOrigin ?? false,
    stripSensitiveHeaders: plain.redirect?.stripSensitiveHeaders ?? true,
  };

  const responseType = plain.responseType ?? "bytes";
  const decompress = plain.decompress ?? true;
  const throwHttpErrors = plain.throwHttpErrors ?? true;
  const hooks = freezeHooks((plain as { hooks?: HttpHooks }).hooks ?? EMPTY_HOOKS);

  const tracing = {
    requestIdHeader: plain.tracing?.requestIdHeader,
    generateRequestId: plain.tracing?.generateRequestId,
    errorBodyPreviewBytes: plain.tracing?.errorBodyPreviewBytes ?? 1024,
  };

  return {
    method,
    url,
    headers,
    body,
    searchParamsApplied: plain.searchParams !== undefined,
    timeout,
    retry,
    redirect,
    responseType,
    decompress,
    throwHttpErrors,
    signal: plain.signal ?? undefined,
    hooks,
    context: { ...plain.context },
    adapter: plain.adapter,
    baseUrl: typeof plain.baseUrl === "string" ? plain.baseUrl : plain.baseUrl?.toString(),
    tracing,
  };
}

/**
 * Convenience: merge then normalize.
 */
export function mergeAndNormalize(
  parent: Readonly<RequestOptions>,
  child: Readonly<RequestOptions>,
): NormalizedRequestOptions {
  return normalizeRequestOptions(mergeRequestOptions(parent, child));
}

import { AbortError } from "../errors/abort-error.js";
import { HttpClientError } from "../errors/http-client-error.js";
import { HTTPStatusError } from "../errors/http-status-error.js";
import { NetworkError } from "../errors/network-error.js";
import { RedirectError } from "../errors/redirect-error.js";
import { RetryError } from "../errors/retry-error.js";
import { TimeoutError } from "../errors/timeout-error.js";
import type { AdapterContext, AdapterResponse, HttpAdapter } from "../types/adapter.js";
import type { NormalizedRequestOptions } from "../types/internal.js";
import type { RequestOptions } from "../types/public.js";
import type { HttpResponse } from "../types/response.js";
import { mergeTimings } from "../utils/timing.js";
import { readStreamToBytes } from "../utils/stream.js";
import { defaultGenerateRequestId } from "../utils/request-id.js";
import {
  runAfterResponseHooks,
  runBeforeErrorHooks,
  runBeforeRedirectHooks,
  runBeforeRequestHooks,
  runBeforeRetryHooks,
  runInitHooks,
} from "./hooks.js";
import {
  applyRedirectPolicy,
  assertSameOriginIfNeeded,
  isRedirectStatus,
  resolveRedirectLocation,
} from "./redirect.js";
import { buildBodyValue, HttpResponseImpl } from "./response.js";
import { defaultCalculateDelay, shouldRetryAttempt } from "./retry.js";
import { createTimeoutSignal, mergeAbortSignals, throwIfAborted } from "./timeout.js";

function responseFromError(error: unknown): HttpResponse<unknown> | undefined {
  if (error instanceof HTTPStatusError) return error.response;
  return undefined;
}

function pickDeadlineMs(a: number | undefined, b: number | undefined): number | undefined {
  const xs = [a, b].filter((x): x is number => typeof x === "number" && x > 0);
  if (xs.length === 0) return undefined;
  return Math.min(...xs);
}

async function readBodyBytesWithTimeout(
  stream: ReadableStream<Uint8Array> | null,
  readTimeoutMs: number | undefined,
  signal: AbortSignal | undefined,
): Promise<Uint8Array> {
  if (stream === null) return new Uint8Array();
  if (readTimeoutMs === undefined || readTimeoutMs <= 0) {
    return await readStreamToBytes(stream);
  }

  const { signal: timeoutSignal, cancel } = createTimeoutSignal(readTimeoutMs);
  const merged = mergeAbortSignals(signal, timeoutSignal);

  const abortPromise = new Promise<never>((_, reject) => {
    const onAbort = () => {
      if (signal?.aborted) {
        reject(new AbortError(undefined, { cause: signal.reason }));
        return;
      }
      reject(new TimeoutError(`Timeout (read) after ${readTimeoutMs}ms`, { phase: "read" }));
    };
    merged?.addEventListener("abort", onAbort, { once: true });
  });

  try {
    return await Promise.race([readStreamToBytes(stream), abortPromise]);
  } finally {
    cancel();
  }
}

async function callAdapter(
  adapter: HttpAdapter,
  normalized: NormalizedRequestOptions,
  signal: AbortSignal | undefined,
  context: Record<string, unknown>,
  requestId: string,
): Promise<AdapterResponse> {
  const timings: AdapterContext["timings"] = {};
  const ctx: AdapterContext = { signal, context, timings };
  try {
    return await adapter.execute(normalized, ctx);
  } catch (cause) {
    if (cause instanceof HttpClientError) throw cause;
    if (cause instanceof DOMException && cause.name === "AbortError") {
      throw new AbortError(undefined, { cause, request: normalized, requestId, context });
    }
    throw new NetworkError("Network request failed", {
      cause,
      context,
      request: normalized,
      requestId,
    });
  }
}

type ResponseBodyState =
  | { kind: "none" }
  | { kind: "bytes"; data: Uint8Array }
  | { kind: "stream"; stream: ReadableStream<Uint8Array> };

async function finalizeAdapterResponse(opts: {
  adapterRes: AdapterResponse;
  normalized: NormalizedRequestOptions;
  retryCount: number;
  readTimeoutMs: number | undefined;
  signal: AbortSignal | undefined;
}): Promise<HttpResponse<unknown>> {
  let { adapterRes, normalized, retryCount, readTimeoutMs, signal } = opts;
  const headersRecord: Record<string, string> = {};
  for (const [k, v] of adapterRes.headers.entries()) {
    headersRecord[k.toLowerCase()] = v;
  }

  const rawBody = adapterRes.body;
  let bytes: Uint8Array | undefined;
  let bodyState: ResponseBodyState;

  if (normalized.responseType === "stream") {
    if (rawBody instanceof ReadableStream) {
      bodyState = { kind: "stream", stream: rawBody };
    } else if (rawBody instanceof Uint8Array) {
      bodyState = { kind: "bytes", data: rawBody };
    } else {
      bodyState = { kind: "none" };
    }
  } else {
    const t0 = performance.now();
    let stream: ReadableStream<Uint8Array> | null = null;
    if (rawBody instanceof ReadableStream) {
      stream = rawBody;
    } else if (rawBody instanceof Uint8Array) {
      bytes = rawBody;
    }
    if (bytes === undefined) {
      bytes = await readBodyBytesWithTimeout(stream, readTimeoutMs, signal);
    }
    const readMs = performance.now() - t0;
    const mergedTimings = mergeTimings(adapterRes.timings, { read: readMs });
    adapterRes = { ...adapterRes, timings: mergedTimings };
    bodyState = { kind: "bytes", data: bytes };
  }

  const timings = adapterRes.timings;
  const streamBody =
    normalized.responseType === "stream" && rawBody instanceof ReadableStream ? rawBody : null;
  const bodyValue = buildBodyValue(bytes, normalized.responseType, streamBody);

  return new HttpResponseImpl({
    url: adapterRes.url,
    status: adapterRes.status,
    statusText: adapterRes.statusText,
    ok: adapterRes.ok,
    headers: headersRecord,
    body: bodyValue as unknown,
    rawBody: bytes,
    bodyState,
    timings,
    request: normalized,
    retryCount,
  });
}

export class AfterResponseControlledRetry extends Error {
  readonly delayMs?: number | undefined;
  constructor(delayMs?: number | undefined) {
    super("afterResponse:retry");
    this.name = "AfterResponseControlledRetry";
    this.delayMs = delayMs;
  }
}

export async function executeRequest(opts: {
  plain: Readonly<RequestOptions>;
  normalized: NormalizedRequestOptions;
  defaultAdapter: HttpAdapter;
}): Promise<HttpResponse<unknown>> {
  const { plain, normalized, defaultAdapter } = opts;
  const adapter = normalized.adapter ?? defaultAdapter;

  await runInitHooks(normalized.hooks, plain, normalized);

  let consumedRetries = 0;
  const requestId =
    normalized.tracing.generateRequestId?.() ?? defaultGenerateRequestId();

  while (true) {
    throwIfAborted(normalized.signal);
    try {
      return await attemptOnce({ plain, normalized, adapter, consumedRetries, requestId });
    } catch (error) {
      if (error instanceof AfterResponseControlledRetry) {
        if (consumedRetries >= normalized.retry.limit) {
          throw new RetryError("Retry limit exhausted (afterResponse)", {
            lastError: error,
            request: normalized,
            retryCount: consumedRetries,
            context: normalized.context,
            requestId,
          });
        }

        await runBeforeRetryHooks(normalized.hooks, {
          error,
          attempt: consumedRetries + 1,
          retryCount: consumedRetries,
          normalized,
          context: normalized.context,
        });

        const delay =
          error.delayMs ??
          normalized.retry.calculateDelay?.({
            attempt: consumedRetries + 1,
            retryCount: consumedRetries,
            error,
            request: normalized,
          }) ??
          defaultCalculateDelay({
            attempt: consumedRetries + 1,
            retryCount: consumedRetries,
            error,
            request: normalized,
          });

        await new Promise<void>((resolve) => setTimeout(resolve, delay));
        consumedRetries += 1;
        continue;
      }

      if (
        !shouldRetryAttempt({
          error,
          normalized,
          response: responseFromError(error),
        })
      ) {
        throw await runBeforeErrorHooks(normalized.hooks, {
          error,
          normalized,
          context: normalized.context,
        });
      }

      if (consumedRetries >= normalized.retry.limit) {
        throw new RetryError("Retry limit exhausted", {
          lastError: error,
          request: normalized,
          retryCount: consumedRetries,
          context: normalized.context,
          requestId,
        });
      }

      await runBeforeRetryHooks(normalized.hooks, {
        error,
        attempt: consumedRetries + 1,
        retryCount: consumedRetries,
        normalized,
        context: normalized.context,
      });

      const delay =
        normalized.retry.calculateDelay?.({
          attempt: consumedRetries + 1,
          retryCount: consumedRetries,
          error,
          request: normalized,
        }) ??
        defaultCalculateDelay({
          attempt: consumedRetries + 1,
          retryCount: consumedRetries,
          error,
          request: normalized,
        });

      await new Promise<void>((resolve) => setTimeout(resolve, delay));
      consumedRetries += 1;
    }
  }
}

async function attemptOnce(opts: {
  plain: Readonly<RequestOptions>;
  normalized: NormalizedRequestOptions;
  adapter: HttpAdapter;
  consumedRetries: number;
  requestId: string;
}): Promise<HttpResponse<unknown>> {
  const { plain, normalized, adapter, consumedRetries, requestId } = opts;

  const { signal: reqTimeoutSignal, cancel: cancelReq } = createTimeoutSignal(
    pickDeadlineMs(normalized.timeout.request, normalized.timeout.response),
  );
  const execSignal = mergeAbortSignals(normalized.signal, reqTimeoutSignal);

  try {
    await runBeforeRequestHooks(normalized.hooks, {
      plain,
      normalized,
      signal: execSignal,
      context: normalized.context,
    });

    const tracingHeader = normalized.tracing.requestIdHeader?.toLowerCase();
    let current: NormalizedRequestOptions = { ...normalized, context: { ...normalized.context, requestId } };
    if (tracingHeader) {
      current = {
        ...current,
        headers:
          current.headers[tracingHeader] === undefined
            ? { ...current.headers, [tracingHeader]: requestId }
            : current.headers,
      };
    }
    const visited = new Set<string>([current.url]);
    let redirectCount = 0;

    for (;;) {
      throwIfAborted(execSignal);
      const adapterRes = await callAdapter(adapter, current, execSignal, current.context, requestId);

      if (current.redirect.follow && isRedirectStatus(adapterRes.status)) {
        if (redirectCount >= current.redirect.max) {
          throw new RedirectError("Maximum redirect count exceeded", {
            redirectCount,
            lastLocation: adapterRes.headers.get("location") ?? undefined,
            request: current,
            context: current.context,
            requestId,
          });
        }

        const location = adapterRes.headers.get("location");
        const nextUrl = resolveRedirectLocation(adapterRes.url, location);
        assertSameOriginIfNeeded(adapterRes.url, nextUrl, current.redirect.strictOrigin);

        await runBeforeRedirectHooks(current.hooks, {
          from: current,
          toUrl: nextUrl,
          status: adapterRes.status,
          redirectIndex: redirectCount,
          context: current.context,
        });

        current = applyRedirectPolicy({ status: adapterRes.status, from: current, toUrl: nextUrl });
        redirectCount += 1;

        if (visited.has(current.url)) {
          throw new RedirectError("Redirect loop detected", {
            redirectCount,
            lastLocation: location ?? undefined,
            request: current,
            context: current.context,
            requestId,
          });
        }
        visited.add(current.url);
        continue;
      }

      const response = await finalizeAdapterResponse({
        adapterRes,
        normalized: current,
        retryCount: consumedRetries,
        readTimeoutMs: current.timeout.read,
        signal: execSignal,
      });

      const after = await runAfterResponseHooks(current.hooks, {
        response,
        normalized: current,
        context: current.context,
      });

      if (after.retry !== undefined) {
        throw new AfterResponseControlledRetry(after.retry.delayMs);
      }

      const finalResponse = after.response;

      if (!finalResponse.ok && current.throwHttpErrors) {
        let preview: string | undefined;
        if (finalResponse.rawBody) {
          const limit = current.tracing.errorBodyPreviewBytes;
          const slice = finalResponse.rawBody.slice(0, limit);
          preview = new TextDecoder("utf-8", { fatal: false }).decode(slice);
        }
        throw new HTTPStatusError(`HTTP ${finalResponse.status} ${finalResponse.statusText}`, {
          response: finalResponse,
          request: current,
          context: current.context,
          requestId,
          responseBodyPreview: preview,
        });
      }

      return finalResponse;
    }
  } finally {
    cancelReq();
  }
}

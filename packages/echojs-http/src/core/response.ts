import { HTTPStatusError } from "../errors/http-status-error.js";
import { ParseError } from "../errors/parse-error.js";
import type { ResponseLike } from "../types/hooks.js";
import type { NormalizedRequestOptions } from "../types/internal.js";
import type { HttpHeaders, HttpResponse } from "../types/response.js";
import type { HttpTimings } from "../types/timings.js";
import { createHttpHeadersView } from "../utils/headers.js";
import { readStreamToBytes } from "../utils/stream.js";
import { parseBytesBody } from "./parse-bytes-body.js";
import { parseJsonBody } from "./parse-json-body.js";
import { parseTextBody } from "./parse-text-body.js";

type BodyState =
  | { kind: "none" }
  | { kind: "bytes"; data: Uint8Array }
  | { kind: "stream"; stream: ReadableStream<Uint8Array> };

export class HttpResponseImpl<TBody = unknown> implements HttpResponse<TBody> {
  readonly url: string;
  readonly status: number;
  readonly statusText: string;
  readonly ok: boolean;
  readonly headers: HttpHeaders;
  readonly body: TBody;
  readonly rawBody?: Uint8Array | undefined;
  readonly timings?: HttpTimings | undefined;
  readonly request: Readonly<NormalizedRequestOptions>;
  readonly retryCount: number;

  private bodyState: BodyState;
  private streamConsumed = false;

  constructor(opts: {
    url: string;
    status: number;
    statusText: string;
    ok: boolean;
    headers: Readonly<Record<string, string>>;
    body: TBody;
    rawBody?: Uint8Array | undefined;
    bodyState: BodyState;
    timings?: HttpTimings | undefined;
    request: Readonly<NormalizedRequestOptions>;
    retryCount: number;
  }) {
    this.url = opts.url;
    this.status = opts.status;
    this.statusText = opts.statusText;
    this.ok = opts.ok;
    this.headers = createHttpHeadersView(opts.headers);
    this.body = opts.body;
    this.rawBody = opts.rawBody;
    this.timings = opts.timings;
    this.request = opts.request;
    this.retryCount = opts.retryCount;
    this.bodyState = opts.bodyState;
  }

  async json<R = unknown>(): Promise<R> {
    const text = await this.text();
    return parseJsonBody<R>(text, {
      request: this.request,
      response: this,
      context: this.request.context,
    });
  }

  async text(): Promise<string> {
    const bytes = await this.bytes();
    return parseTextBody(bytes, undefined, {
      request: this.request,
      response: this,
      context: this.request.context,
    });
  }

  async bytes(): Promise<Uint8Array> {
    if (this.bodyState.kind === "bytes") {
      return this.bodyState.data;
    }
    if (this.bodyState.kind === "stream") {
      if (this.streamConsumed) {
        throw new ParseError("Response body was already consumed", {
          request: this.request,
          response: this,
          context: this.request.context,
        });
      }
      this.streamConsumed = true;
      const buf = await readStreamToBytes(this.bodyState.stream as ReadableStream<Uint8Array>);
      this.bodyState = { kind: "bytes", data: buf };
      return buf;
    }
    return new Uint8Array();
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    const u8 = await this.bytes();
    const copy = new Uint8Array(u8.byteLength);
    copy.set(u8);
    return copy.buffer;
  }

  assertOk(): void {
    if (this.ok) return;
    throw new HTTPStatusError(`HTTP ${this.status} ${this.statusText}`, {
      response: this,
      request: this.request,
      timings: this.timings,
      retryCount: this.retryCount,
      context: this.request.context,
    });
  }

  async unwrapJson<R = unknown>(): Promise<R> {
    this.assertOk();
    return await this.json<R>();
  }
}

export async function httpResponseFromResponseLike(
  like: ResponseLike,
  request: Readonly<NormalizedRequestOptions>,
  retryCount: number,
): Promise<HttpResponse<unknown>> {
  const headersRecord: Record<string, string> = {};
  for (const [k, v] of like.headers.entries()) {
    headersRecord[k.toLowerCase()] = v;
  }
  const cloned = like.clone();
  const stream = cloned.body;
  if (stream === null) {
    return new HttpResponseImpl({
      url: like.url,
      status: like.status,
      statusText: like.statusText,
      ok: like.ok,
      headers: headersRecord,
      body: undefined,
      bodyState: { kind: "none" },
      timings: undefined,
      request,
      retryCount,
    });
  }
  const buf = await readStreamToBytes(stream as ReadableStream<Uint8Array>);
  return new HttpResponseImpl({
    url: like.url,
    status: like.status,
    statusText: like.statusText,
    ok: like.ok,
    headers: headersRecord,
    body: undefined,
    rawBody: buf,
    bodyState: { kind: "bytes", data: buf },
    timings: undefined,
    request,
    retryCount,
  });
}

export function assertOk(response: HttpResponse<unknown>, throwHttpErrors: boolean): void {
  if (!throwHttpErrors) return;
  if (!response.ok) {
    throw new HTTPStatusError(`HTTP ${response.status} ${response.statusText}`, { response });
  }
}

export function buildBodyValue(
  bytes: Uint8Array | undefined,
  responseType: NormalizedRequestOptions["responseType"],
  stream: ReadableStream<Uint8Array> | null | undefined,
): unknown {
  if (responseType === "stream") {
    return stream ?? undefined;
  }
  if (bytes === undefined) return undefined;
  if (responseType === "bytes") return parseBytesBody(bytes);
  if (responseType === "text") {
    return parseTextBody(bytes, undefined, {});
  }
  // `json` is intentionally parsed via `.json()` to preserve a single controlled parse path.
  return undefined;
}

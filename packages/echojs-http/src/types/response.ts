import type { NormalizedRequestOptions } from "./internal.js";
import type { HttpTimings } from "./timings.js";

/**
 * Case-insensitive header view used by {@link HttpResponse}.
 */
export interface HttpHeaders {
  get(name: string): string | null;
  has(name: string): boolean;
  entries(): IterableIterator<[string, string]>;
}

/**
 * Typed HTTP response with lazy parsing helpers.
 */
export interface HttpResponse<TBody = unknown> {
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

  json<T = unknown>(): Promise<T>;
  text(): Promise<string>;
  bytes(): Promise<Uint8Array>;
  arrayBuffer(): Promise<ArrayBuffer>;

  /** Throws {@link HTTPStatusError} when not ok. */
  assertOk(): void;

  /** `assertOk()` + `json<T>()` */
  unwrapJson<T = unknown>(): Promise<T>;
}

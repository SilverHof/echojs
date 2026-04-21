import type { NormalizedRequestOptions } from "./internal.js";

export interface AdapterCapabilities {
  stream: boolean;
  uploadProgress: boolean;
  downloadProgress: boolean;
  cookies: boolean;
  proxy: boolean;
}

export interface AdapterTimings {
  /** Time until the adapter accepted the request (DNS/TCP/TLS + send start). */
  request?: number | undefined;
  /** Time until response status/headers were available. */
  response?: number | undefined;
  /** Time spent reading/decoding the body (best-effort). */
  read?: number | undefined;
}

export interface AdapterContext {
  readonly signal: AbortSignal | undefined;
  readonly context: Record<string, unknown>;
  readonly timings: AdapterTimings;
}

export interface AdapterResponse {
  readonly url: string;
  readonly status: number;
  readonly statusText: string;
  readonly ok: boolean;
  readonly headers: Headers;
  readonly body: ReadableStream<Uint8Array> | Uint8Array | null;
  readonly timings?: AdapterTimings | undefined;
}

/**
 * Pluggable transport executed by the core pipeline.
 */
export interface HttpAdapter {
  readonly name: string;
  readonly supports: AdapterCapabilities;
  execute(
    request: Readonly<NormalizedRequestOptions>,
    ctx: AdapterContext,
  ): Promise<AdapterResponse>;
}

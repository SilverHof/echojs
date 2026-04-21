import type { AdapterContext, AdapterResponse, HttpAdapter } from "../types/adapter.js";
import type { NormalizedBody, NormalizedRequestOptions } from "../types/internal.js";

function toFetchBody(body: NormalizedBody): BodyInit | undefined {
  switch (body.kind) {
    case "none":
      return undefined;
    case "raw":
      return body.body as BodyInit;
    case "json":
      return body.data;
    case "form":
      return body.data;
  }
}

/**
 * Default adapter backed by global `fetch`.
 *
 * Capabilities reflect the lowest common denominator across runtimes; progress/proxy are adapter-level concerns.
 */
export const fetchAdapter: HttpAdapter = {
  name: "fetch",
  supports: {
    stream: true,
    uploadProgress: false,
    downloadProgress: false,
    cookies: typeof document !== "undefined",
    proxy: false,
  },
  async execute(
    request: Readonly<NormalizedRequestOptions>,
    ctx: AdapterContext,
  ): Promise<AdapterResponse> {
    const init: RequestInit = {
      method: request.method,
      headers: request.headers,
      body: toFetchBody(request.body),
      redirect: "manual",
      signal: ctx.signal,
    };

    const t0 = performance.now();
    const res = await fetch(request.url, init);
    ctx.timings.response = performance.now() - t0;

    // `fetch` may decompress automatically depending on runtime; `decompress` is honored at the capability/docs layer.

    return {
      url: res.url,
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
      headers: new Headers(res.headers),
      body: res.body,
    };
  },
};

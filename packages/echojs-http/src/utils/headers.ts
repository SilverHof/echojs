import type { HeadersInitLike } from "../types/public.js";

function normalizeHeaderName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Merges header bags into a single lower-cased key map (last writer wins).
 */
export function mergeHeaders(
  ...sources: Array<HeadersInitLike | undefined>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const source of sources) {
    if (source === undefined) continue;
    if (source instanceof Headers) {
      for (const [k, v] of source.entries()) {
        out[normalizeHeaderName(k)] = v;
      }
      continue;
    }
    if (Array.isArray(source) || typeof (source as Iterable<readonly [string, string]>)[Symbol.iterator] === "function") {
      for (const [k, v] of source as Iterable<readonly [string, string]>) {
        out[normalizeHeaderName(k)] = v;
      }
      continue;
    }
    for (const [k, v] of Object.entries(source as Record<string, string | undefined | null>)) {
      if (v === undefined || v === null) continue;
      out[normalizeHeaderName(k)] = String(v);
    }
  }
  return out;
}

export function createHttpHeadersView(headers: Readonly<Record<string, string>>): import("../types/response.js").HttpHeaders {
  return {
    get(name: string) {
      return headers[normalizeHeaderName(name)] ?? null;
    },
    has(name: string) {
      return normalizeHeaderName(name) in headers;
    },
    *entries(): IterableIterator<[string, string]> {
      for (const [k, v] of Object.entries(headers)) {
        yield [k, v];
      }
    },
  };
}

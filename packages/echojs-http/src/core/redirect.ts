import type { NormalizedBody, NormalizedRequestOptions } from "../types/internal.js";
import { mergeHeaders } from "../utils/headers.js";

const SENSITIVE_HEADER_NAMES = new Set([
  "authorization",
  "cookie",
  "proxy-authorization",
  "set-cookie",
]);

export function isRedirectStatus(status: number): boolean {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

export function resolveRedirectLocation(currentUrl: string, location: string | null): string {
  if (location === null || location === "") {
    throw new Error("Redirect response missing Location header");
  }
  return new URL(location, currentUrl).toString();
}

export function stripSensitiveHeadersForRedirect(
  headers: Readonly<Record<string, string>>,
  fromUrl: string,
  toUrl: string,
  enabled: boolean,
): Record<string, string> {
  if (!enabled) return { ...headers };
  let fromOrigin: string;
  let toOrigin: string;
  try {
    fromOrigin = new URL(fromUrl).origin;
    toOrigin = new URL(toUrl).origin;
  } catch {
    return { ...headers };
  }
  if (fromOrigin === toOrigin) return { ...headers };
  const out: Record<string, string> = { ...headers };
  for (const name of SENSITIVE_HEADER_NAMES) {
    delete out[name];
  }
  return out;
}

export function applyRedirectPolicy(opts: {
  status: number;
  from: Readonly<NormalizedRequestOptions>;
  toUrl: string;
}): NormalizedRequestOptions {
  const { status, from, toUrl } = opts;
  let method = from.method;
  let body: NormalizedBody = from.body;

  if (status === 303) {
    method = "GET";
    body = { kind: "none" };
  } else if ((status === 301 || status === 302) && !from.redirect.keepMethod) {
    if (method !== "GET" && method !== "HEAD") {
      method = "GET";
      body = { kind: "none" };
    }
  }

  const nextHeaders = stripSensitiveHeadersForRedirect(from.headers, from.url, toUrl, from.redirect.stripSensitiveHeaders);

  return {
    ...from,
    url: toUrl,
    method,
    body,
    headers: mergeHeaders(nextHeaders),
  };
}

export function assertSameOriginIfNeeded(fromUrl: string, toUrl: string, strict: boolean): void {
  if (!strict) return;
  const a = new URL(fromUrl).origin;
  const b = new URL(toUrl).origin;
  if (a !== b) {
    throw new Error("Cross-origin redirect blocked by redirect.strictOrigin");
  }
}

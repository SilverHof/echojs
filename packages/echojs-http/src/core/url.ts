import type { SearchParamsInitLike } from "../types/public.js";

export function toUrlString(input: string | URL | undefined): string | undefined {
  if (input === undefined) return undefined;
  return typeof input === "string" ? input : input.toString();
}

export function appendSearchParams(url: URL, searchParams: SearchParamsInitLike | undefined): void {
  if (searchParams === undefined) return;
  if (typeof searchParams === "string") {
    const extra = new URLSearchParams(searchParams);
    for (const [k, v] of extra.entries()) {
      url.searchParams.append(k, v);
    }
    return;
  }
  if (searchParams instanceof URLSearchParams) {
    for (const [k, v] of searchParams.entries()) {
      url.searchParams.append(k, v);
    }
    return;
  }
  if (Array.isArray(searchParams)) {
    for (const [k, v] of searchParams) {
      url.searchParams.append(k, v);
    }
    return;
  }
  for (const [k, v] of Object.entries(searchParams)) {
    if (v === undefined || v === null) continue;
    url.searchParams.append(k, String(v));
  }
}

export function buildUrl(parts: {
  baseUrl?: string | URL | undefined;
  url?: string | URL | undefined;
  searchParams?: SearchParamsInitLike | undefined;
}): string {
  const base = toUrlString(parts.baseUrl);
  const rel = toUrlString(parts.url);
  if (rel === undefined || rel === "") {
    throw new Error("Request URL is required");
  }
  const resolved =
    base !== undefined && base !== ""
      ? new URL(rel, base.endsWith("/") ? base : `${base}/`)
      : new URL(rel);
  appendSearchParams(resolved, parts.searchParams);
  return resolved.toString();
}

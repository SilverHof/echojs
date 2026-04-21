import { describe, expect, it } from "vitest";
import { normalizeRequestOptions } from "../../src/options/normalize.js";
import {
  applyRedirectPolicy,
  assertSameOriginIfNeeded,
  isRedirectStatus,
  resolveRedirectLocation,
} from "../../src/core/redirect.js";

describe("redirect helpers", () => {
  it("detects redirect statuses", () => {
    expect(isRedirectStatus(302)).toBe(true);
    expect(isRedirectStatus(200)).toBe(false);
  });

  it("resolves relative Location", () => {
    expect(resolveRedirectLocation("https://a.test/x", "/y")).toBe("https://a.test/y");
  });

  it("blocks cross-origin redirects when strictOrigin is enabled", () => {
    expect(() =>
      assertSameOriginIfNeeded("https://a.test/x", "https://b.test/y", true),
    ).toThrowError(/Cross-origin redirect blocked/);
  });

  it("rewrites POST on 302 when keepMethod is false", () => {
    const from = normalizeRequestOptions({
      url: "https://a.test/",
      method: "POST",
      json: { a: 1 },
      redirect: { follow: true, max: 10, keepMethod: false, strictOrigin: false, stripSensitiveHeaders: true },
    });
    const next = applyRedirectPolicy({ status: 302, from, toUrl: "https://a.test/b" });
    expect(next.method).toBe("GET");
    expect(next.body).toEqual({ kind: "none" });
  });
});

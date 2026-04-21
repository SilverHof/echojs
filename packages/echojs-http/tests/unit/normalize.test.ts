import { describe, expect, it } from "vitest";
import { normalizeRequestOptions } from "../../src/options/normalize.js";

describe("normalizeRequestOptions", () => {
  it("uppercases method", () => {
    const n = normalizeRequestOptions({ method: "get", url: "https://example.test/" });
    expect(n.method).toBe("GET");
  });

  it("resolves baseUrl+url", () => {
    const n = normalizeRequestOptions({ baseUrl: "https://api.test", url: "/v1" });
    expect(n.url).toBe("https://api.test/v1");
  });

  it("serializes search params", () => {
    const n = normalizeRequestOptions({
      url: "https://example.test/path",
      searchParams: { a: 1, b: "x" },
    });
    expect(n.url).toContain("a=1");
    expect(n.url).toContain("b=x");
  });
});

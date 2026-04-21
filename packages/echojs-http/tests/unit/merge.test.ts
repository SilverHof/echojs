import { describe, expect, it } from "vitest";
import { mergeRequestOptions } from "../../src/options/merge.js";

describe("mergeRequestOptions", () => {
  it("child wins for scalars", () => {
    const merged = mergeRequestOptions({ baseUrl: "https://a.test" }, { baseUrl: "https://b.test" });
    expect(merged.baseUrl).toBe("https://b.test");
  });

  it("merges headers with child overriding keys", () => {
    const merged = mergeRequestOptions(
      { headers: { "x-a": "1", "x-b": "2" } },
      { headers: { "x-b": "3" } },
    );
    expect(merged.headers).toEqual({ "x-a": "1", "x-b": "3" } as Record<string, string>);
  });

  it("concatenates hooks in stable order", () => {
    const a = () => {};
    const b = () => {};
    const merged = mergeRequestOptions(
      { hooks: { init: [a] } },
      { hooks: { init: [b] } },
    );
    expect(merged.hooks?.init?.length).toBe(2);
    expect(merged.hooks?.init?.[0]).toBe(a);
    expect(merged.hooks?.init?.[1]).toBe(b);
  });

  it("merges nested timeout objects", () => {
    const merged = mergeRequestOptions({ timeout: { request: 1, read: 3 } }, { timeout: { response: 2 } });
    expect(merged.timeout).toEqual({ request: 1, read: 3, response: 2 });
  });
});

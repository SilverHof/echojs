import { describe, expect, it } from "vitest";
import { buildNormalizedBody } from "../../src/core/body.js";

describe("body serialization", () => {
  it("serializes json", () => {
    const b = buildNormalizedBody({ json: { a: 1 } });
    expect(b).toEqual({ kind: "json", data: "{\"a\":1}", contentType: "application/json; charset=utf-8" });
  });

  it("serializes form", () => {
    const b = buildNormalizedBody({ form: { a: "1", b: 2 } });
    expect(b.kind).toBe("form");
    if (b.kind === "form") {
      expect(b.data.get("a")).toBe("1");
      expect(b.data.get("b")).toBe("2");
    }
  });
});

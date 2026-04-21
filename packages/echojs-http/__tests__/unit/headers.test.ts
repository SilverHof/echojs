import { describe, expect, it } from "vitest";
import { mergeHeaders } from "../../src/utils/headers.js";

describe("mergeHeaders", () => {
  it("merges case-insensitively with last writer winning", () => {
    const h = mergeHeaders({ "X-Test": "1" }, { "x-test": "2" });
    expect(h["x-test"]).toBe("2");
  });
});

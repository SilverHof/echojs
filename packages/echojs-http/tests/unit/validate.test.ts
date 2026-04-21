import { describe, expect, it } from "vitest";
import { validateRequestOptions } from "../../src/options/validate.js";

describe("validateRequestOptions", () => {
  it("rejects body+json", () => {
    expect(() =>
      validateRequestOptions({
        body: "x",
        json: { a: 1 },
      }),
    ).toThrowError(/Conflicting body options/);
  });

  it("rejects body+form", () => {
    expect(() =>
      validateRequestOptions({
        body: "x",
        form: { a: "1" },
      }),
    ).toThrowError(/Conflicting body options/);
  });

  it("rejects json+form", () => {
    expect(() =>
      validateRequestOptions({
        json: { a: 1 },
        form: { a: "1" },
      }),
    ).toThrowError(/Conflicting body options/);
  });
});

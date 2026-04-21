import { describe, it, expect } from "vitest";
import { validateRequestOptions } from "../validate.js";
import { RequestError } from "../../errors/request-error.js";
import type { RequestOptions } from "../../types/public.js";

describe("validateRequestOptions", () => {
  it("should not throw when no body options are set", () => {
    const options: RequestOptions = {};
    expect(() => validateRequestOptions(options)).not.toThrow();
  });

  it("should not throw when only body is set", () => {
    const options: RequestOptions = { body: "test" };
    expect(() => validateRequestOptions(options)).not.toThrow();
  });

  it("should not throw when only json is set", () => {
    const options: RequestOptions = { json: { key: "value" } };
    expect(() => validateRequestOptions(options)).not.toThrow();
  });

  it("should not throw when only form is set", () => {
    const options: RequestOptions = { form: { key: "value" } };
    expect(() => validateRequestOptions(options)).not.toThrow();
  });

  it("should throw when body and json are both set", () => {
    const options: RequestOptions = { body: "test", json: { key: "value" } };
    expect(() => validateRequestOptions(options)).toThrow(RequestError);
    expect(() => validateRequestOptions(options)).toThrow("Conflicting body options");
  });

  it("should throw when body and form are both set", () => {
    const options: RequestOptions = { body: "test", form: { key: "value" } };
    expect(() => validateRequestOptions(options)).toThrow(RequestError);
    expect(() => validateRequestOptions(options)).toThrow("Conflicting body options");
  });

  it("should throw when json and form are both set", () => {
    const options: RequestOptions = { json: { key: "value" }, form: { key: "value" } };
    expect(() => validateRequestOptions(options)).toThrow(RequestError);
    expect(() => validateRequestOptions(options)).toThrow("Conflicting body options");
  });

  it("should throw when all three body options are set", () => {
    const options: RequestOptions = { body: "test", json: { key: "value" }, form: { key: "value" } };
    expect(() => validateRequestOptions(options)).toThrow(RequestError);
  });
});

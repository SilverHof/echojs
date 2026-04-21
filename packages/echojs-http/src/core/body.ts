import type { NormalizedBody } from "../types/internal.js";
import type { BodyInitLike, RequestOptions } from "../types/public.js";
import { serializeFormBody } from "./serialize-form-body.js";
import { serializeJsonBody } from "./serialize-json-body.js";

export function buildNormalizedBody(opts: Readonly<RequestOptions>): NormalizedBody {
  if (opts.json !== undefined) {
    const { data, contentType } = serializeJsonBody(opts.json);
    return { kind: "json", data, contentType };
  }
  if (opts.form !== undefined) {
    const { data, contentType } = serializeFormBody(opts.form);
    return { kind: "form", data, contentType };
  }
  if (opts.body !== undefined) {
    return { kind: "raw", body: opts.body as BodyInitLike };
  }
  return { kind: "none" };
}

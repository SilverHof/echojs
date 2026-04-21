import { RequestError } from "../errors/request-error.js";
import type { RequestOptions } from "../types/public.js";

export function validateRequestOptions(opts: Readonly<RequestOptions>): void {
  const hasBody = opts.body !== undefined;
  const hasJson = opts.json !== undefined;
  const hasForm = opts.form !== undefined;
  const n = (hasBody ? 1 : 0) + (hasJson ? 1 : 0) + (hasForm ? 1 : 0);
  if (n > 1) {
    throw new RequestError(
      "Conflicting body options: only one of `body`, `json`, or `form` may be set",
      {},
    );
  }
}

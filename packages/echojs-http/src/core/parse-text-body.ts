import { ParseError } from "../errors/parse-error.js";
import type { NormalizedRequestOptions } from "../types/internal.js";
import type { HttpResponse } from "../types/response.js";

export function parseTextBody(
  bytes: Uint8Array,
  encoding: string | undefined,
  meta: {
    request?: Readonly<NormalizedRequestOptions>;
    response?: HttpResponse<unknown>;
    context?: Record<string, unknown>;
  },
): string {
  try {
    return new TextDecoder(encoding ?? "utf-8").decode(bytes);
  } catch (cause) {
    throw new ParseError("Failed to decode text body", {
      cause,
      request: meta.request,
      response: meta.response,
      context: meta.context,
    });
  }
}

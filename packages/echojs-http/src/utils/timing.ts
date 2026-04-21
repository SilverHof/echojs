import type { AdapterTimings } from "../types/adapter.js";
import type { HttpTimings } from "../types/timings.js";

export function mergeTimings(
  a: AdapterTimings | undefined,
  b: AdapterTimings | undefined,
): HttpTimings | undefined {
  if (a === undefined && b === undefined) return undefined;
  return { ...a, ...b };
}

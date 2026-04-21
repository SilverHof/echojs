export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isAfterResponseRetryDirective(
  value: unknown,
): value is import("../types/hooks.js").AfterResponseRetryDirective {
  return isObject(value) && value["kind"] === "retry";
}

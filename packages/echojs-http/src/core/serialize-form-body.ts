/**
 * Serializes a form payload as `application/x-www-form-urlencoded`.
 */
export function serializeFormBody(
  form: Record<string, unknown> | URLSearchParams,
): { data: URLSearchParams; contentType: string } {
  if (form instanceof URLSearchParams) {
    return { data: new URLSearchParams(form), contentType: "application/x-www-form-urlencoded" };
  }
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(form)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      params.append(k, String(v));
    } else {
      params.append(k, JSON.stringify(v));
    }
  }
  return { data: params, contentType: "application/x-www-form-urlencoded" };
}

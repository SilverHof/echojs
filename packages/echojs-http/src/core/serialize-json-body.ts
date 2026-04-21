/**
 * Serializes a JSON payload and sets a conventional content type.
 */
export function serializeJsonBody(value: unknown): { data: string; contentType: string } {
  return {
    data: JSON.stringify(value),
    contentType: "application/json; charset=utf-8",
  };
}

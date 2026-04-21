/**
 * Normalizes arbitrary binary chunks to a single `Uint8Array`.
 */
export function parseBytesBody(data: ArrayBuffer | Uint8Array): Uint8Array {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

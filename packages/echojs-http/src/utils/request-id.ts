export function defaultGenerateRequestId(): string {
  const cryptoAny = globalThis.crypto as unknown as { randomUUID?: () => string } | undefined;
  if (cryptoAny?.randomUUID) return cryptoAny.randomUUID();
  // Fallback: not cryptographically strong, but stable enough for correlation.
  return `echo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}


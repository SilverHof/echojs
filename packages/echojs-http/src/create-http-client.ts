import { HttpClientImpl, type HttpClient } from './client.js';
import type { RequestOptions } from './types/public.js';

/**
 * Creates an immutable-by-default HTTP client instance.
 *
 * @remarks
 * Use {@link HttpClient.extend} to derive clients with layered defaults.
 */
export function createHttpClient(defaults: RequestOptions = {}): HttpClient {
  return new HttpClientImpl(defaults);
}

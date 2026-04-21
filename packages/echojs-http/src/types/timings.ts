/**
 * High-level timing phases for observability and errors.
 *
 * Semantics mirror {@link import("./adapter.js").AdapterTimings}; values are milliseconds when present.
 */
export interface HttpTimings {
  request?: number | undefined;
  response?: number | undefined;
  read?: number | undefined;
}

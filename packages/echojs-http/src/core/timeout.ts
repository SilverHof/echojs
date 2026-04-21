import { AbortError } from "../errors/abort-error.js";
import { TimeoutError } from "../errors/timeout-error.js";
import type { TimeoutPhase } from "../errors/timeout-error.js";

export function mergeAbortSignals(a: AbortSignal | undefined, b: AbortSignal | undefined): AbortSignal | undefined {
  if (a === undefined) return b;
  if (b === undefined) return a;
  const controller = new AbortController();
  const forward = (src: AbortSignal) => {
    if (src.aborted) {
      controller.abort(src.reason);
      return;
    }
    src.addEventListener("abort", () => controller.abort(src.reason), { once: true });
  };
  forward(a);
  forward(b);
  return controller.signal;
}

/**
 * Creates an `AbortSignal` that aborts after `timeoutMs`.
 *
 * Best-effort: this is the primary portable mechanism to bound `fetch` wall time.
 */
export function createTimeoutSignal(timeoutMs: number | undefined): { signal: AbortSignal | undefined; cancel: () => void } {
  if (timeoutMs === undefined || timeoutMs <= 0) {
    return { signal: undefined, cancel: () => {} };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    cancel: () => clearTimeout(timer),
  };
}

export function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw new AbortError(undefined, { cause: signal.reason });
  }
}

export function throwTimeout(phase: TimeoutPhase, timeoutMs: number): never {
  throw new TimeoutError(`Timeout (${phase}) after ${timeoutMs}ms`, { phase });
}

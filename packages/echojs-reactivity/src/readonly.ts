import { brandReadonly } from "./internals/guards.js";
import type { ReadonlySignal, Signal } from "./types.js";

export const readonly = <T>(sig: Signal<T> | ReadonlySignal<T>): ReadonlySignal<T> => {
  if (typeof (sig as any).set !== "function") return sig as ReadonlySignal<T>;
  if (typeof (sig as any).readonly === "function") return (sig as Signal<T>).readonly();

  return brandReadonly({
    value: () => sig.value(),
    peek: () => sig.peek(),
    subscribe: (fn: () => void) => sig.subscribe(fn),
  }) as ReadonlySignal<T>;
};


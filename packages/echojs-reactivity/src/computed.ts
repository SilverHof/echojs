import { createSubscribe } from "./subscribe.js";
import { createAlienComputed, untrack } from "./internals/alien.js";
import { brandReadonly } from "./internals/guards.js";
import type { ReadonlySignal, ReadValue } from "./types.js";

export const computed = <T>(getter: () => T): ReadonlySignal<T> => {
  if (typeof getter !== "function") {
    throw new TypeError("computed(getter) expects a function");
  }

  const engine = createAlienComputed<T>(() => getter());

  const readTracked = (): T => engine();
  const readUntracked = (): T => untrack(() => engine());

  const subscribe = createSubscribe(readTracked);

  return brandReadonly({
    value: () => readTracked() as ReadValue<T>,
    peek: () => readUntracked() as ReadValue<T>,
    subscribe,
  }) as ReadonlySignal<T>;
};


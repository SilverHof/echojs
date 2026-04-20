import { freezeIfDev } from "./freeze.js";
import { createSubscribe } from "./subscribe.js";
import { createAlienSignal, untrack } from "./internals/alien.js";
import { brandReadonly, brandWritable } from "./internals/guards.js";
import type { ReadonlySignal, ReadValue, Signal } from "./types.js";

export const createReadonlySignalFacade = <T>(impl: {
  value(): ReadValue<T>;
  peek(): ReadValue<T>;
  subscribe(fn: () => void): () => void;
}): ReadonlySignal<T> => {
  return brandReadonly({
    value: impl.value,
    peek: impl.peek,
    subscribe: impl.subscribe,
  });
};

const signalImpl = <T>(...args: [initial: T] | []): Signal<T> => {
  if (args.length === 0) {
    throw new TypeError("signal(initial) expects 1 argument");
  }

  const initial = args[0] as T;
  const engine = createAlienSignal(freezeIfDev(initial));

  const readTracked = (): T => engine();
  const readUntracked = (): T => untrack(() => engine());

  const subscribe = createSubscribe(readTracked);

  const readonlyFacade = createReadonlySignalFacade<T>({
    value: () => readTracked() as ReadValue<T>,
    peek: () => readUntracked() as ReadValue<T>,
    subscribe,
  });

  const writable: Signal<T> = brandWritable({
    value: () => readTracked() as ReadValue<T>,
    peek: () => readUntracked() as ReadValue<T>,
    subscribe,
    set: (next: T) => {
      engine(freezeIfDev(next));
    },
    update: (fn: (prev: T) => T) => {
      const prev = readUntracked();
      const next = fn(prev);
      engine(freezeIfDev(next));
    },
    readonly: () => readonlyFacade,
  });

  return writable;
};

export const signal = signalImpl as <T>(initial: T) => Signal<T>;

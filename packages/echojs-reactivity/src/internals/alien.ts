import {
  computed as alienComputed,
  effect as alienEffect,
  effectScope as alienEffectScope,
  endBatch as alienEndBatch,
  setActiveSub as alienSetActiveSub,
  signal as alienSignal,
  startBatch as alienStartBatch,
} from "alien-signals";

export type Disposer = () => void;

export const createAlienSignal = <T>(initial: T) => {
  return alienSignal(initial);
};

export const createAlienComputed = <T>(getter: (prev?: T) => T) => {
  return alienComputed(getter);
};

export const createAlienEffect = (fn: () => void): Disposer => {
  return alienEffect(fn);
};

export const createAlienScope = (fn: () => void): Disposer => {
  return alienEffectScope(fn);
};

export const batch = <T>(fn: () => T): T => {
  alienStartBatch();
  try {
    return fn();
  } finally {
    alienEndBatch();
  }
};

export const untrack = <T>(fn: () => T): T => {
  const prev = alienSetActiveSub(undefined);
  try {
    return fn();
  } finally {
    alienSetActiveSub(prev);
  }
};


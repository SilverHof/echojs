import { isBrandedReadonlySignal, isBrandedSignal } from "./internals/guards.js";
import type { ReadonlySignal, Signal } from "./types.js";

export const isSignal = (
  value: unknown,
): value is Signal<unknown> | ReadonlySignal<unknown> => {
  return isBrandedSignal(value);
};

export const isReadonlySignal = (value: unknown): value is ReadonlySignal<unknown> => {
  return isBrandedReadonlySignal(value);
};


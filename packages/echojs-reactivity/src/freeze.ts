import { isObjectLike } from "./utils.js";

const DEV = ((): boolean => {
  const env = (globalThis as any)?.process?.env;
  const nodeEnv = env?.NODE_ENV;
  return nodeEnv !== "production";
})();

const deepFreezeImpl = (value: unknown, seen: WeakSet<object>): void => {
  if (!isObjectLike(value)) return;
  if (Object.isFrozen(value)) return;
  if (seen.has(value)) return;
  seen.add(value);

  const keys = Object.keys(value);
  for (const k of keys) {
    deepFreezeImpl((value as any)[k], seen);
  }

  Object.freeze(value);
};

export const freezeIfDev = <T>(value: T): T => {
  if (!DEV) return value;
  if (!isObjectLike(value)) return value;

  deepFreezeImpl(value, new WeakSet());
  return value;
};

export const __isDevModeForTests = (): boolean => {
  return DEV;
};


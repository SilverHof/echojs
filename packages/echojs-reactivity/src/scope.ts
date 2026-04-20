import { createAlienScope } from "./internals/alien.js";

export const scope = (fn: () => void): (() => void) => {
  if (typeof fn !== "function") {
    throw new TypeError("scope(fn) expects a function");
  }
  return createAlienScope(fn);
};


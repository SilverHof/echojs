import { createAlienEffect } from "./internals/alien.js";

export const effect = (fn: () => void): (() => void) => {
  if (typeof fn !== "function") {
    throw new TypeError("effect(fn) expects a function");
  }
  return createAlienEffect(fn);
};


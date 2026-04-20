import { batch as alienBatch } from "./internals/alien.js";

export const batch = <T>(fn: () => T): T => {
  if (typeof fn !== "function") {
    throw new TypeError("batch(fn) expects a function");
  }
  return alienBatch(fn);
};


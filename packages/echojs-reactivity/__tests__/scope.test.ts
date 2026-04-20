import { describe, expect, it } from "vitest";
import { effect, scope, signal } from "../src/index.js";

describe("scope()", () => {
  it("бросает TypeError на неправильный fn", () => {
    expect(() => (scope as any)("x")).toThrow(TypeError);
  });

  it("очищает вложенные эффекты", () => {
    const $count = signal(0);
    let runs = 0;

    const stopScope = scope(() => {
      effect(() => {
        $count.value();
        runs++;
      });
    });

    expect(runs).toBe(1);
    $count.set(1);
    expect(runs).toBe(2);

    stopScope();
    $count.set(2);
    expect(runs).toBe(2);
  });

  it("stopScope() идемпотентен (можно вызвать дважды)", () => {
    const stopScope = scope(() => {
      effect(() => {});
    });
    stopScope();
    stopScope();
  });
});


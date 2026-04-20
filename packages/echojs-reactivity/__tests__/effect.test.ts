import { describe, expect, it } from "vitest";
import { effect, signal } from "../src/index.js";

describe("effect()", () => {
  it("бросает TypeError на неправильный fn", () => {
    expect(() => (effect as any)(undefined)).toThrow(TypeError);
  });

  it("реагирует на изменения", () => {
    const $count = signal(0);
    let runs = 0;

    const stop = effect(() => {
      $count.value();
      runs++;
    });

    expect(runs).toBe(1);
    $count.set(1);
    expect(runs).toBe(2);

    stop();
    $count.set(2);
    expect(runs).toBe(2);
  });

  it("peek() читает без трекинга", () => {
    const $count = signal(0);
    let runs = 0;

    const stop = effect(() => {
      $count.peek();
      runs++;
    });

    expect(runs).toBe(1);
    $count.set(1);
    expect(runs).toBe(1);

    stop();
  });
});


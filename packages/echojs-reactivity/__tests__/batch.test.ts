import { describe, expect, it } from "vitest";
import { batch, effect, signal } from "../src/index.js";

describe("batch()", () => {
  it("бросает TypeError на неправильный fn", () => {
    expect(() => (batch as any)(0)).toThrow(TypeError);
  });

  it("возвращает значение fn()", () => {
    const v = batch(() => 123);
    expect(v).toBe(123);
  });

  it("группирует обновления корректно", () => {
    const $a = signal(0);
    const $b = signal(0);
    let runs = 0;

    const stop = effect(() => {
      $a.value();
      $b.value();
      runs++;
    });

    expect(runs).toBe(1);

    batch(() => {
      $a.set(1);
      $b.set(2);
    });

    expect(runs).toBe(2);

    stop();
  });
});


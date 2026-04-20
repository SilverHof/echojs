import { describe, expect, it } from "vitest";
import { computed, signal } from "../src/index.js";

describe("computed()", () => {
  it("бросает TypeError на неправильный getter", () => {
    expect(() => (computed as any)(null)).toThrow(TypeError);
  });

  it("пересчитывается от зависимостей", () => {
    const $count = signal(1);
    const $double = computed(() => $count.value() * 2);

    expect($double.value()).toBe(2);
    $count.set(2);
    expect($double.value()).toBe(4);
  });
});


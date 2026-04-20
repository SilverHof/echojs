import { describe, expect, it } from "vitest";
import { computed, readonly, signal } from "../src/index.js";

describe("readonly()", () => {
  it("возвращает тот же объект, если сигнал уже readonly", () => {
    const $count = signal(1);
    const $ro1 = $count.readonly();
    const $ro2 = readonly($ro1);
    expect($ro2).toBe($ro1);
  });

  it("не меняет computed (и не добавляет set)", () => {
    const $count = signal(1);
    const $double = computed(() => $count.value() * 2);
    const $ro = readonly($double);

    expect($ro.value()).toBe(2);
    expect((($ro as any).set as any) ?? undefined).toBeUndefined();
  });
});


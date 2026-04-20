import { describe, expect, it, vi } from "vitest";
import { computed, signal } from "../src/index.js";

describe("subscribe()", () => {
  it("вызывается только на реальные изменения и умеет unsubscribe", () => {
    const $count = signal(0);
    const spy = vi.fn();

    const unsub = $count.subscribe(spy);
    expect(spy).toHaveBeenCalledTimes(0);

    $count.set(1);
    expect(spy).toHaveBeenCalledTimes(1);

    $count.set(1);
    expect(spy).toHaveBeenCalledTimes(1);

    unsub();
    $count.set(2);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("работает и на computed()", () => {
    const $count = signal(0);
    const $double = computed(() => $count.value() * 2);
    const spy = vi.fn();

    const unsub = $double.subscribe(spy);
    $count.set(1);
    expect(spy).toHaveBeenCalledTimes(1);

    unsub();
    $count.set(2);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("не вызывает callback, если computed-значение не изменилось", () => {
    const $count = signal(0);
    const $parity = computed(() => $count.value() % 2);
    const spy = vi.fn();

    const unsub = $parity.subscribe(spy);
    $count.set(2); // parity всё ещё 0
    expect(spy).toHaveBeenCalledTimes(0);

    $count.set(3); // parity 1
    expect(spy).toHaveBeenCalledTimes(1);

    unsub();
  });

  it("бросает TypeError на неправильный аргумент", () => {
    const $count = signal(0);
    expect(() => ($count as any).subscribe(null)).toThrow(TypeError);
  });

  it("unsubscribe() идемпотентен (можно вызвать дважды)", () => {
    const $count = signal(0);
    const unsub = $count.subscribe(() => {});
    unsub();
    unsub();
  });
});


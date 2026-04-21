import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  mergeAbortSignals,
  createTimeoutSignal,
  throwIfAborted,
  throwTimeout,
} from "../timeout.js";
import { AbortError } from "../../errors/abort-error.js";
import { TimeoutError } from "../../errors/timeout-error.js";

describe("mergeAbortSignals", () => {
  it("should return b when a is undefined", () => {
    const signal = new AbortController().signal;
    expect(mergeAbortSignals(undefined, signal)).toBe(signal);
  });

  it("should return a when b is undefined", () => {
    const signal = new AbortController().signal;
    expect(mergeAbortSignals(signal, undefined)).toBe(signal);
  });

  it("should return undefined when both are undefined", () => {
    expect(mergeAbortSignals(undefined, undefined)).toBeUndefined();
  });

  it("should create merged signal that aborts when a aborts", () => {
    const controllerA = new AbortController();
    const controllerB = new AbortController();
    const merged = mergeAbortSignals(controllerA.signal, controllerB.signal);

    expect(merged!.aborted).toBe(false);
    controllerA.abort("reason A");
    expect(merged!.aborted).toBe(true);
    expect(merged!.reason).toBe("reason A");
  });

  it("should create merged signal that aborts when b aborts", () => {
    const controllerA = new AbortController();
    const controllerB = new AbortController();
    const merged = mergeAbortSignals(controllerA.signal, controllerB.signal);

    expect(merged!.aborted).toBe(false);
    controllerB.abort("reason B");
    expect(merged!.aborted).toBe(true);
    expect(merged!.reason).toBe("reason B");
  });

  it("should abort immediately if a is already aborted", () => {
    const controllerA = new AbortController();
    const controllerB = new AbortController();
    controllerA.abort("already aborted");
    const merged = mergeAbortSignals(controllerA.signal, controllerB.signal);
    expect(merged!.aborted).toBe(true);
  });

  it("should abort immediately if b is already aborted", () => {
    const controllerA = new AbortController();
    const controllerB = new AbortController();
    controllerB.abort("already aborted");
    const merged = mergeAbortSignals(controllerA.signal, controllerB.signal);
    expect(merged!.aborted).toBe(true);
  });
});

describe("createTimeoutSignal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return undefined signal when timeoutMs is undefined", () => {
    const result = createTimeoutSignal(undefined);
    expect(result.signal).toBeUndefined();
    expect(typeof result.cancel).toBe("function");
  });

  it("should return undefined signal when timeoutMs is 0", () => {
    const result = createTimeoutSignal(0);
    expect(result.signal).toBeUndefined();
  });

  it("should return undefined signal when timeoutMs is negative", () => {
    const result = createTimeoutSignal(-100);
    expect(result.signal).toBeUndefined();
  });

  it("should create signal that is not aborted initially", () => {
    const result = createTimeoutSignal(1000);
    expect(result.signal).toBeDefined();
    expect(result.signal!.aborted).toBe(false);
  });

  it("should abort signal after timeout", () => {
    const result = createTimeoutSignal(1000);
    expect(result.signal!.aborted).toBe(false);
    vi.advanceTimersByTime(1000);
    expect(result.signal!.aborted).toBe(true);
  });

  it("should not abort before timeout", () => {
    const result = createTimeoutSignal(1000);
    vi.advanceTimersByTime(999);
    expect(result.signal!.aborted).toBe(false);
  });

  it("should cancel timeout when cancel is called", () => {
    const result = createTimeoutSignal(1000);
    result.cancel();
    vi.advanceTimersByTime(1000);
    expect(result.signal!.aborted).toBe(false);
  });

  it("should have no-op cancel when signal is undefined", () => {
    const result = createTimeoutSignal(undefined);
    expect(() => result.cancel()).not.toThrow();
  });
});

describe("throwIfAborted", () => {
  it("should not throw when signal is undefined", () => {
    expect(() => throwIfAborted(undefined)).not.toThrow();
  });

  it("should not throw when signal is not aborted", () => {
    const controller = new AbortController();
    expect(() => throwIfAborted(controller.signal)).not.toThrow();
  });

  it("should throw AbortError when signal is aborted", () => {
    const controller = new AbortController();
    controller.abort("test reason");
    expect(() => throwIfAborted(controller.signal)).toThrow(AbortError);
  });

  it("should throw AbortError with cause when signal is aborted", () => {
    const controller = new AbortController();
    controller.abort("test reason");
    try {
      throwIfAborted(controller.signal);
    } catch (error) {
      expect(error).toBeInstanceOf(AbortError);
      expect((error as AbortError).cause).toBe("test reason");
    }
  });
});

describe("throwTimeout", () => {
  it("should throw TimeoutError", () => {
    expect(() => throwTimeout("request", 5000)).toThrow(TimeoutError);
  });

  it("should throw with correct message", () => {
    expect(() => throwTimeout("request", 5000)).toThrow("Timeout (request) after 5000ms");
    expect(() => throwTimeout("response", 3000)).toThrow("Timeout (response) after 3000ms");
    expect(() => throwTimeout("read", 10000)).toThrow("Timeout (read) after 10000ms");
  });

  it("should include phase in error", () => {
    try {
      throwTimeout("response", 5000);
    } catch (error) {
      expect(error).toBeInstanceOf(TimeoutError);
      expect((error as TimeoutError).phase).toBe("response");
    }
  });
});

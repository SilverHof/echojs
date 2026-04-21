import { describe, it, expect } from "vitest";
import { readStreamToBytes } from "../stream.js";

describe("readStreamToBytes", () => {
  it("should read empty stream", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.close();
      },
    });
    const result = await readStreamToBytes(stream);
    expect(result).toEqual(new Uint8Array(0));
  });

  it("should read single chunk", async () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(data);
        controller.close();
      },
    });
    const result = await readStreamToBytes(stream);
    expect(result).toEqual(data);
  });

  it("should read multiple chunks", async () => {
    const chunk1 = new Uint8Array([1, 2]);
    const chunk2 = new Uint8Array([3, 4]);
    const chunk3 = new Uint8Array([5, 6]);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(chunk1);
        controller.enqueue(chunk2);
        controller.enqueue(chunk3);
        controller.close();
      },
    });
    const result = await readStreamToBytes(stream);
    expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6]));
  });

  it("should handle chunks of different sizes", async () => {
    const chunk1 = new Uint8Array([1]);
    const chunk2 = new Uint8Array([2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const chunk3 = new Uint8Array([11, 12]);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(chunk1);
        controller.enqueue(chunk2);
        controller.enqueue(chunk3);
        controller.close();
      },
    });
    const result = await readStreamToBytes(stream);
    expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]));
  });

  it("should release reader lock after reading", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2, 3]));
        controller.close();
      },
    });
    await readStreamToBytes(stream);
    // Getting a new reader should not throw if lock was released
    expect(() => stream.getReader()).not.toThrow();
  });

  it("should handle empty chunks", async () => {
    const chunk1 = new Uint8Array([1, 2]);
    const chunk2 = new Uint8Array(0);
    const chunk3 = new Uint8Array([3, 4]);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(chunk1);
        controller.enqueue(chunk2);
        controller.enqueue(chunk3);
        controller.close();
      },
    });
    const result = await readStreamToBytes(stream);
    expect(result).toEqual(new Uint8Array([1, 2, 3, 4]));
  });

  it("should read large data", async () => {
    const largeData = new Uint8Array(10000).fill(42);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(largeData);
        controller.close();
      },
    });
    const result = await readStreamToBytes(stream);
    expect(result.byteLength).toBe(10000);
    expect(result[0]).toBe(42);
    expect(result[9999]).toBe(42);
  });
});

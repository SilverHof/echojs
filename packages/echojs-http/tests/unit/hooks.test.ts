import { describe, expect, it } from "vitest";
import { mergeRequestOptions } from "../../src/options/merge.js";
import { normalizeRequestOptions } from "../../src/options/normalize.js";
import { runInitHooks } from "../../src/core/hooks.js";

describe("hooks ordering", () => {
  it("runs init hooks in registration order", async () => {
    const order: number[] = [];
    const plain = mergeRequestOptions(
      {},
      {
        url: "https://example.test/",
        hooks: {
          init: [
            () => {
              order.push(1);
            },
            () => {
              order.push(2);
            },
          ],
        },
      },
    );
    const normalized = normalizeRequestOptions(plain);
    await runInitHooks(normalized.hooks, plain, normalized);
    expect(order).toEqual([1, 2]);
  });
});

import { describe, it, expect } from "vitest";
import { defaultGenerateRequestId } from "../request-id.js";

describe("defaultGenerateRequestId", () => {
  it("should return a string", () => {
    const id = defaultGenerateRequestId();
    expect(typeof id).toBe("string");
  });

  it("should return different values on subsequent calls", () => {
    const id1 = defaultGenerateRequestId();
    const id2 = defaultGenerateRequestId();
    expect(id1).not.toBe(id2);
  });

  it("should return a valid UUID-like string or echo- prefix format", () => {
    const id = defaultGenerateRequestId();
    // Either it's a standard UUID or our fallback format
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const isFallback = id.startsWith("echo-");
    expect(isUUID || isFallback).toBe(true);
  });

  it("should have proper format when using fallback", () => {
    // Generate multiple IDs to ensure we test the function
    const ids = Array.from({ length: 10 }, () => defaultGenerateRequestId());

    for (const id of ids) {
      // All IDs should be non-empty strings
      expect(id.length).toBeGreaterThan(0);

      // If it's a fallback format, verify structure
      if (id.startsWith("echo-")) {
        const parts = id.split("-");
        expect(parts.length).toBeGreaterThanOrEqual(3);
        expect(parts[0]).toBe("echo");
      }
    }
  });

  it("should generate unique IDs", () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(defaultGenerateRequestId());
    }
    // All 100 IDs should be unique
    expect(ids.size).toBe(100);
  });
});

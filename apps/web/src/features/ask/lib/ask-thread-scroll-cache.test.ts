import { describe, expect, it, vi } from "vitest";

import {
  clearCachedAskThreadScrollTop,
  getAskThreadScrollStorageKey,
  readCachedAskThreadScrollTop,
  writeCachedAskThreadScrollTop,
} from "@/features/ask/lib/ask-thread-scroll-cache";

function createStorageMock(initialEntries?: Record<string, string>) {
  const store = new Map(Object.entries(initialEntries ?? {}));

  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
  };
}

describe("ask-thread-scroll-cache", () => {
  it("builds a stable per-org per-thread storage key", () => {
    expect(getAskThreadScrollStorageKey("org_123", "thread_456")).toBe(
      "pulseops-ask-thread-scroll:org_123:thread_456",
    );
  });

  it("returns null when no cached scroll position exists", () => {
    const storage = createStorageMock();

    expect(readCachedAskThreadScrollTop("org_123", "thread_456", storage)).toBeNull();
  });

  it("reads a cached scroll position and normalizes the stored value", () => {
    const storage = createStorageMock({
      [getAskThreadScrollStorageKey("org_123", "thread_456")]: "19.6",
    });

    expect(readCachedAskThreadScrollTop("org_123", "thread_456", storage)).toBe(20);
  });

  it("ignores invalid cached scroll positions", () => {
    const storage = createStorageMock({
      [getAskThreadScrollStorageKey("org_123", "thread_456")]: "not-a-number",
    });

    expect(readCachedAskThreadScrollTop("org_123", "thread_456", storage)).toBeNull();
  });

  it("writes a normalized scroll position", () => {
    const storage = createStorageMock();

    expect(writeCachedAskThreadScrollTop("org_123", "thread_456", 42.7, storage)).toBe(43);
    expect(storage.setItem).toHaveBeenCalledWith(
      "pulseops-ask-thread-scroll:org_123:thread_456",
      "43",
    );
  });

  it("clears a cached scroll position", () => {
    const storage = createStorageMock();

    clearCachedAskThreadScrollTop("org_123", "thread_456", storage);

    expect(storage.removeItem).toHaveBeenCalledWith(
      "pulseops-ask-thread-scroll:org_123:thread_456",
    );
  });
});

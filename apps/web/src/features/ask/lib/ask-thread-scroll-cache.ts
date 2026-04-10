type StorageLike = Pick<Storage, "getItem" | "removeItem" | "setItem">;

const ASK_THREAD_SCROLL_CACHE_KEY_PREFIX = "pulseops-ask-thread-scroll";

export function getAskThreadScrollStorageKey(orgId: string, threadId: string) {
  return `${ASK_THREAD_SCROLL_CACHE_KEY_PREFIX}:${orgId}:${threadId}`;
}

export function readCachedAskThreadScrollTop(
  orgId: string,
  threadId: string,
  storage: StorageLike | null = getBrowserStorage(),
) {
  const storedScrollTop = storage?.getItem(getAskThreadScrollStorageKey(orgId, threadId));

  if (storedScrollTop === null || storedScrollTop === undefined) {
    return null;
  }

  const parsedScrollTop = Number(storedScrollTop);

  if (!Number.isFinite(parsedScrollTop)) {
    return null;
  }

  return normalizeAskThreadScrollTop(parsedScrollTop);
}

export function writeCachedAskThreadScrollTop(
  orgId: string,
  threadId: string,
  scrollTop: number,
  storage: StorageLike | null = getBrowserStorage(),
) {
  const normalizedScrollTop = normalizeAskThreadScrollTop(scrollTop);
  storage?.setItem(getAskThreadScrollStorageKey(orgId, threadId), String(normalizedScrollTop));
  return normalizedScrollTop;
}

export function clearCachedAskThreadScrollTop(
  orgId: string,
  threadId: string,
  storage: StorageLike | null = getBrowserStorage(),
) {
  storage?.removeItem(getAskThreadScrollStorageKey(orgId, threadId));
}

function normalizeAskThreadScrollTop(scrollTop: number) {
  return Math.max(0, Math.round(scrollTop));
}

function getBrowserStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

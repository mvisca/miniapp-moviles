const TTL_MS = 3600_000; // 1 hora

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export function getCached<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (raw === null) {
    return null;
  }

  let parsed: CacheEntry<T>;
  try {
    parsed = JSON.parse(raw) as CacheEntry<T>;
  } catch {
    localStorage.removeItem(key);
    return null;
  }

  if (Date.now() - parsed.timestamp > TTL_MS) {
    localStorage.removeItem(key);
    return null;
  }

  return parsed.data;
}

export function setCached<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = { data, timestamp: Date.now() };
  localStorage.setItem(key, JSON.stringify(entry));
}

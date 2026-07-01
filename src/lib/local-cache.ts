// 홈 카드용 범용 localStorage 캐시 (stale-while-revalidate).
// 지난 결과를 즉시 보여주고 백그라운드에서 갱신 → "불러오는중" 깜빡임 제거.

export function readCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

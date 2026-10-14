const DAY_MS = 86_400_000;

export function nowMs(): number {
  return Date.now();
}

export function daysAgoIso(days: number): string {
  return new Date(nowMs() - days * DAY_MS).toISOString();
}

export function dateKeyDaysAgo(days: number): string {
  return daysAgoIso(days).slice(0, 10);
}

export function shortDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", timeZone: "UTC" }
  );
}

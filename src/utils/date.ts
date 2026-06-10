const MAX_FUTURE_DRIFT_MS = 24 * 60 * 60 * 1000;

export function safeISODate(date: Date, fallback = new Date()): string {
  const time = date.getTime();
  if (
    !Number.isFinite(time) ||
    time > fallback.getTime() + MAX_FUTURE_DRIFT_MS
  ) {
    return fallback.toISOString();
  }
  return date.toISOString();
}

const requestWindowByKey = new Map<string, number[]>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;

  const current = requestWindowByKey.get(key) ?? [];
  const fresh = current.filter((value) => value > cutoff);
  fresh.push(now);
  requestWindowByKey.set(key, fresh);

  return fresh.length > limit;
}

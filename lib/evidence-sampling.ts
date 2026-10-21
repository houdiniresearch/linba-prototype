/** Round-robin groups before applying the text budget: a busy group cannot hide all others. */
export function balancedSample<T>(
  items: T[],
  group: (item: T) => string,
  maxItems: number,
) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = group(item);
    const bucket = groups.get(key) || [];
    bucket.push(item);
    groups.set(key, bucket);
  }
  const result: T[] = [];
  for (let round = 0; result.length < maxItems; round++) {
    let found = false;
    for (const bucket of groups.values()) {
      if (bucket[round] !== undefined) {
        result.push(bucket[round]);
        found = true;
      }
      if (result.length === maxItems) break;
    }
    if (!found) break;
  }
  return result;
}
export function textBudget<T>(items: T[], limit: number) {
  let used = 0;
  return items.filter((item) => {
    const size = JSON.stringify(item).length;
    if (used + size > limit) return false;
    used += size;
    return true;
  });
}

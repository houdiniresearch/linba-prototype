/** Preserve collection semantics while repositories perform network I/O. */
export async function asyncMap<T, R>(
  items: readonly T[],
  fn: (value: T, index: number, array: readonly T[]) => Promise<R>,
): Promise<R[]> {
  return Promise.all(items.map(fn));
}
export async function asyncFilter<T>(
  items: readonly T[],
  fn: (value: T, index: number, array: readonly T[]) => Promise<unknown>,
): Promise<T[]> {
  const matches = await Promise.all(items.map(fn));
  return items.filter((_, index) => matches[index]);
}
export async function asyncFind<T>(
  items: readonly T[],
  fn: (value: T, index: number, array: readonly T[]) => Promise<unknown>,
): Promise<T | undefined> {
  for (let index = 0; index < items.length; index++)
    if (await fn(items[index], index, items)) return items[index];
}
export async function asyncSome<T>(
  items: readonly T[],
  fn: (value: T, index: number, array: readonly T[]) => Promise<unknown>,
): Promise<boolean> {
  return (await asyncFind(items, fn)) !== undefined;
}
export async function asyncEvery<T>(
  items: readonly T[],
  fn: (value: T, index: number, array: readonly T[]) => Promise<unknown>,
): Promise<boolean> {
  for (let index = 0; index < items.length; index++)
    if (!(await fn(items[index], index, items))) return false;
  return true;
}
export async function asyncForEach<T>(
  items: readonly T[],
  fn: (value: T, index: number, array: readonly T[]) => Promise<unknown>,
): Promise<void> {
  for (let index = 0; index < items.length; index++)
    await fn(items[index], index, items);
}

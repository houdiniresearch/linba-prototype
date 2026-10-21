/** Bounded, process-local read-through cache for immutable presentation bytes.
 * Callers authorize each request before looking here. Failed loads are never cached. */
export class AssetCache {
  private values = new Map<string, { value: Buffer; expires: number }>();
  private pending = new Map<string, Promise<Buffer>>();
  private bytes = 0;
  constructor(
    private maxBytes = 64 * 1024 * 1024,
    private ttl = 3600_000,
  ) {}
  invalidate(prefix: string) {
    for (const [key, entry] of this.values)
      if (key.startsWith(prefix)) {
        this.bytes -= entry.value.byteLength;
        this.values.delete(key);
      }
    for (const key of this.pending.keys())
      if (key.startsWith(prefix)) this.pending.delete(key);
  }
  async read(key: string, load: () => Promise<Buffer>): Promise<Buffer> {
    const entry = this.values.get(key);
    if (entry) {
      this.values.delete(key);
      this.bytes -= entry.value.byteLength;
      if (entry.expires > Date.now()) {
        this.values.set(key, entry);
        this.bytes += entry.value.byteLength;
        return entry.value;
      }
    }
    const existing = this.pending.get(key);
    if (existing) return existing;
    const task = load()
      .then((value) => {
        if (
          this.pending.get(key) === task &&
          value.byteLength <= this.maxBytes
        ) {
          while (this.bytes + value.byteLength > this.maxBytes) {
            const oldest = this.values.entries().next().value;
            if (!oldest) break;
            this.values.delete(oldest[0]);
            this.bytes -= oldest[1].value.byteLength;
          }
          this.values.set(key, { value, expires: Date.now() + this.ttl });
          this.bytes += value.byteLength;
        }
        return value;
      })
      .finally(() => {
        if (this.pending.get(key) === task) this.pending.delete(key);
      });
    this.pending.set(key, task);
    return task;
  }
}

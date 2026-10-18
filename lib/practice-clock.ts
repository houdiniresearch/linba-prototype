/** Connected practice time; preparation, disconnections and feedback are excluded. */
export class PracticeClock {
  private accumulated = 0;
  private startedAt: number | null = null;
  reset(seconds = 0) {
    this.accumulated = Math.max(0, seconds) * 1000;
    this.startedAt = null;
  }
  start(now: number) {
    if (this.startedAt === null) this.startedAt = now;
  }
  stop(now: number) {
    if (this.startedAt !== null)
      this.accumulated += Math.max(0, now - this.startedAt);
    this.startedAt = null;
    return this.seconds(now);
  }
  seconds(now: number) {
    return Math.floor(
      (this.accumulated +
        (this.startedAt === null ? 0 : Math.max(0, now - this.startedAt))) /
        1000,
    );
  }
}

export function formatPracticeDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts = [minutes, Math.floor(seconds % 60)].map((v) =>
    String(v).padStart(2, "0"),
  );
  if (hours) parts.unshift(String(hours).padStart(2, "0"));
  return parts.join(":");
}

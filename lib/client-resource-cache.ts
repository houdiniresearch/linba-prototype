import type { Course, CourseState, User } from "./types";
/** Shared tab-local snapshots. Stale data stays visible during revalidation.
 * Server authorization is always fresh; account changes clear every snapshot. */
export class ClientResourceCache {
  private generation = 0;
  private accountId: string | null | undefined;
  private values = new Map<
    string,
    { value: unknown; expires: number; retainUntil: number }
  >();
  private pending = new Map<string, Promise<unknown>>();
  private listeners = new Set<() => void>();
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  get sessionVersion() {
    return this.generation;
  }
  private notify() {
    this.listeners.forEach((listener) => listener());
  }
  clear() {
    this.generation++;
    this.accountId = undefined;
    this.values.clear();
    this.pending.clear();
    this.notify();
  }
  peek<T>(key: string, stale = false): T | undefined {
    const entry = this.values.get(key);
    if (entry && (stale ? entry.retainUntil : entry.expires) > Date.now())
      return entry.value as T;
  }
  set<T>(key: string, value: T) {
    if (key === "auth") {
      const next = (value as { user?: { id?: string } })?.user?.id || null;
      if (this.accountId !== undefined && this.accountId !== next) this.clear();
      this.accountId = next;
    }
    this.pending.delete(key); // A late GET cannot overwrite a successful mutation.
    if (!this.values.has(key) && this.values.size >= 64)
      this.values.delete(this.values.keys().next().value!);
    const kind = key.split(/[/?]/)[0];
    const isTeam = kind === "team";
    const freshness =
      key === "auth"
        ? 10_000
        : ["team", "account", "groups", "waitlist"].includes(kind)
          ? 30_000
          : key.split("?")[0] === "courses" || key === "report-assistant"
            ? 10_000
            : 3000;
    const now = Date.now();
    this.values.set(key, {
      value,
      expires: now + freshness,
      retainUntil: now + (isTeam ? 30 * 60_000 : 5 * 60_000),
    });
    this.notify();
  }
  remove(key: string) {
    this.pending.delete(key);
    this.values.delete(key);
    this.notify();
  }
  /** Expire freshness, retaining the last successful view while it reloads. */
  invalidate(matches: (key: string) => boolean) {
    for (const key of this.pending.keys())
      if (matches(key)) this.pending.delete(key);
    for (const [key, entry] of this.values) if (matches(key)) entry.expires = 0;
    this.notify();
  }
  invalidateForMutation(url: string, body?: unknown) {
    const [kind, child] = url.split("?")[0].split("/");
    if (kind === "auth" || (kind === "participant" && child === "auth")) {
      this.clear();
      return;
    }
    const kinds = new Set([kind]);
    if (kind === "team" || kind === "team-invites")
      ["team", "courses", "groups", "reports", "report-assistant"].forEach(
        (name) => kinds.add(name),
      );
    if (kind === "account")
      ["auth", "team", "courses", "reports", "report-assistant"].forEach(
        (name) => kinds.add(name),
      );
    if (kind === "courses") {
      kinds.add("reports");
      kinds.add("report-assistant");
      if (
        ["group", "trash", "restore"].some((part) =>
          url.split("/").includes(part),
        )
      )
        kinds.add("groups");
      if ((body as { action?: string })?.action === "end") kinds.add("team");
    }
    if (kind === "groups") kinds.add("courses");
    this.invalidate((key) => kinds.has(key.split(/[/?]/)[0]));
  }
  /** Successful writes are the newest snapshot; publish without a second GET. */
  commit(url: string, result: unknown) {
    if (!result || typeof result !== "object") return;
    const path = url.split("?")[0];
    const payload = result as {
      team?: unknown;
      members?: unknown;
      user?: User;
      course?: Course;
    };
    if (
      path === "team" &&
      "team" in payload &&
      Array.isArray(payload.members)
    ) {
      for (const key of [...this.values.keys()])
        if (key.split("?")[0] === "team") this.set(key, result);
    }
    if (path === "account" && payload.user) {
      const auth = this.peek<{ user?: User }>("auth", true);
      if (auth) this.set("auth", { ...auth, user: payload.user });
    }
    if (path.startsWith("courses") && payload.course?.id) {
      const course = payload.course;
      if (Array.isArray((result as CourseState).questions))
        this.set(`courses/${course.id}`, result);
      const auth = this.peek<{ user?: User }>("auth", true);
      for (const [key, entry] of [...this.values]) {
        if (key.split("?")[0] !== "courses") continue;
        const list = entry.value as { courses?: Course[] };
        if (!Array.isArray(list.courses)) continue;
        const previous = list.courses.find((item) => item.id === course.id);
        const card = {
          ...course,
          pages: [],
          slides: [],
          displayKey: "",
          ownerId: "",
          coverPage: course.coverPage ?? course.pages[0]?.number,
          createdBy:
            course.createdBy ||
            previous?.createdBy ||
            (auth?.user?.id === course.ownerId ? auth.user.name : ""),
        };
        this.set(key, {
          ...list,
          courses: [
            card,
            ...list.courses.filter((item) => item.id !== course.id),
          ],
        });
        this.invalidate((candidate) => candidate === key); // Reconcile ordering/sharing in the background.
      }
    }
  }
  async read<T>(
    key: string,
    load: () => Promise<T>,
    fresh = false,
  ): Promise<T> {
    const cached = this.peek<T>(key);
    if (!fresh && cached !== undefined) return cached;
    const pending = this.pending.get(key);
    if (pending) return pending as Promise<T>;
    const generation = this.generation;
    const task = load()
      .then((value) => {
        if (generation === this.generation && this.pending.get(key) === task)
          this.set(key, value);
        return value;
      })
      .finally(() => {
        if (this.pending.get(key) === task) this.pending.delete(key);
      });
    this.pending.set(key, task);
    return task;
  }
}
export const clientResources = new ClientResourceCache();

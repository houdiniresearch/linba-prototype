import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { AsyncLocalStorage } from "node:async_hooks";
import { supabaseServer, usesSupabase } from "./supabase-server";
export const DATA_DIR =
  process.env.LINBA_DATA_DIR ||
  (usesSupabase()
    ? path.join(tmpdir(), "linba")
    : path.join(process.cwd(), ".linba"));
const globalDb = globalThis as typeof globalThis & {
  linbaDb?: DatabaseSync;
};
export function db() {
  if (!globalDb.linbaDb) {
    mkdirSync(DATA_DIR, { recursive: true });
    const database = new DatabaseSync(path.join(DATA_DIR, "linba.sqlite"));
    database.exec(
      "PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS records (kind TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY(kind,id));",
    );
    globalDb.linbaDb = database;
  }
  return globalDb.linbaDb;
}
const revision = Symbol("linbaRecordRevision");
type Stored = {
  kind: string;
  id: string;
  data: unknown;
  version: number;
};
type Mutation = {
  kind: string;
  id: string;
  data: unknown | null;
  expected_version: number | null;
};
const pending = new AsyncLocalStorage<Map<string, Mutation>>();
const localTransaction = new AsyncLocalStorage<boolean>();
const readCache = new AsyncLocalStorage<
  Map<string, { kind: string; value: Promise<Stored[]> }>
>();
export function withDatabaseReadCache<T>(work: () => Promise<T>) {
  return readCache.run(new Map(), work);
}
const recordKey = (kind: string, id: string) => JSON.stringify([kind, id]);
function withRevision<T>(data: T, version?: number): T {
  if (data && typeof data === "object" && version !== undefined)
    Object.defineProperty(data, revision, {
      value: version,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  return data;
}
function fail(error: { code?: string; message: string }): never {
  if (error.code === "40001" || error.code === "PT409")
    throw Object.assign(new Error("This record changed. Please try again."), {
      status: 409,
      databaseConflict: true,
    });
  // Provider messages may contain row values or configuration. Keep them server-side only.
  console.error("[linba.database]", error.code || "request_failed");
  throw new Error("Database action failed.");
}
async function mutate(operations: Mutation[]) {
  const { data, error } = await supabaseServer().rpc("linba_mutate_records", {
    operations,
  });
  if (error) fail(error);
  const changed = new Set(operations.map((operation) => operation.kind));
  for (const [key, entry] of readCache.getStore() || [])
    if (changed.has(entry.kind)) readCache.getStore()!.delete(key);
  return data as Stored[];
}
export async function get<T>(kind: string, id: string): Promise<T | undefined> {
  if (usesSupabase()) {
    const staged = pending.getStore()?.get(recordKey(kind, id));
    if (staged)
      return staged.data === null
        ? undefined
        : withRevision(
            structuredClone(staged.data) as T,
            staged.expected_version ?? undefined,
          );
    const rows = await memoRead(
      JSON.stringify(["get", kind, id]),
      kind,
      async () => {
        const { data, error } = await supabaseServer()
          .from("linba_records")
          .select("data,version")
          .eq("kind", kind)
          .eq("id", id)
          .maybeSingle();
        if (error) fail(error);
        return data ? [{ kind, id, ...data } as Stored] : [];
      },
    );
    return rows[0]
      ? withRevision(structuredClone(rows[0].data) as T, rows[0].version)
      : undefined;
  }
  const row = db()
    .prepare("SELECT data FROM records WHERE kind=? AND id=?")
    .get(kind, id);
  return row ? (JSON.parse(String(row.data)) as T) : undefined;
}
async function memoRead(
  key: string,
  kind: string,
  load: () => Promise<Stored[]>,
) {
  const memo = readCache.getStore();
  const cached = memo?.get(key);
  if (cached) return cached.value;
  const value = load();
  memo?.set(key, { kind, value });
  try {
    return await value;
  } catch (error) {
    if (memo?.get(key)?.value === value) memo.delete(key);
    throw error;
  }
}
/** Filter at the database boundary; never download other workspaces to filter locally.
 * Memoization lasts only for this request, and writes invalidate the affected kind. */
export async function find<T>(
  kind: string,
  filters: Record<string, string | string[]>,
): Promise<T[]> {
  const fields = Object.entries(filters).sort(([a], [b]) => a.localeCompare(b));
  if (fields.some(([field]) => !/^[a-zA-Z][a-zA-Z0-9]*$/.test(field)))
    throw new Error("Invalid record filter.");
  const matches = (value: unknown) =>
    fields.every(([field, expected]) => {
      const actual = (value as Record<string, unknown>)[field];
      return Array.isArray(expected)
        ? expected.includes(String(actual))
        : actual === expected;
    });
  if (!usesSupabase())
    return db()
      .prepare("SELECT data FROM records WHERE kind=? ORDER BY rowid DESC")
      .all(kind)
      .map((row) => JSON.parse(String(row.data)) as T)
      .filter(matches);
  const result = await memoRead(
    JSON.stringify(["find", kind, fields]),
    kind,
    async () => {
      if (fields.some(([, value]) => Array.isArray(value) && !value.length))
        return [];
      const rows: Stored[] = [];
      for (let offset = 0; ; offset += 1000) {
        let query = supabaseServer()
          .from("linba_records")
          .select("kind,id,data,version")
          .eq("kind", kind);
        for (const [field, value] of fields)
          query = Array.isArray(value)
            ? query.in(`data->>${field}`, value)
            : query.eq(`data->>${field}`, value);
        const { data, error } = await query
          .order("sequence", { ascending: false })
          .range(offset, offset + 999);
        if (error) fail(error);
        rows.push(...(data as Stored[]));
        if (data.length < 1000) break;
      }
      return rows;
    },
  );
  const rows = new Map(
    result.map((row) => [
      row.id,
      withRevision(structuredClone(row.data) as T, row.version),
    ]),
  );
  for (const item of pending.getStore()?.values() || []) {
    if (item.kind !== kind) continue;
    if (item.data === null || !matches(item.data)) rows.delete(item.id);
    else
      rows.set(
        item.id,
        withRevision(
          structuredClone(item.data) as T,
          item.expected_version ?? undefined,
        ),
      );
  }
  return [...rows.values()];
}
export async function all<T>(kind: string): Promise<T[]> {
  return find<T>(kind, {});
}
export async function put<
  T extends {
    id: string;
  },
>(kind: string, value: T): Promise<T> {
  if (usesSupabase()) {
    const key = recordKey(kind, value.id),
      context = pending.getStore();
    const previous = context?.get(key);
    const operation: Mutation = {
      kind,
      id: value.id,
      data: JSON.parse(JSON.stringify(value)),
      expected_version: previous
        ? previous.expected_version
        : ((
            value as T & {
              [revision]?: number;
            }
          )[revision] ?? null),
    };
    if (context) {
      context.set(key, operation);
      return value;
    }
    const rows = await mutate([operation]);
    return withRevision(value, rows[0]?.version);
  }
  db()
    .prepare(
      "INSERT INTO records(kind,id,data) VALUES(?,?,?) ON CONFLICT(kind,id) DO UPDATE SET data=excluded.data",
    )
    .run(kind, value.id, JSON.stringify(value));
  return value;
}
export async function remove(kind: string, id: string) {
  if (usesSupabase()) {
    const existing = await get<{
      id: string;
      [revision]?: number;
    }>(kind, id);
    const operation: Mutation = {
      kind,
      id,
      data: null,
      expected_version: existing?.[revision] ?? null,
    };
    const context = pending.getStore();
    if (context) context.set(recordKey(kind, id), operation);
    else await mutate([operation]);
    return;
  }
  db().prepare("DELETE FROM records WHERE kind=? AND id=?").run(kind, id);
}
/** Remote commits are atomic; asynchronous callbacks never share a transaction. */
export async function transaction<T>(work: () => Promise<T>): Promise<T> {
  if (usesSupabase()) {
    if (pending.getStore()) return work();
    return pending.run(new Map(), async () => {
      const result = await work();
      const operations = [...pending.getStore()!.values()];
      if (operations.length) await mutate(operations);
      return result;
    });
  }
  if (localTransaction.getStore()) return work();
  return localTransaction.run(true, async () => {
    db().exec("BEGIN IMMEDIATE");
    try {
      const result = await work();
      db().exec("COMMIT");
      return result;
    } catch (error) {
      db().exec("ROLLBACK");
      throw error;
    }
  });
}

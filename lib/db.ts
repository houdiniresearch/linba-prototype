import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

export const DATA_DIR =
  process.env.LINBA_DATA_DIR || path.join(process.cwd(), ".linba");
const globalDb = globalThis as typeof globalThis & { linbaDb?: DatabaseSync };
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
export function get<T>(kind: string, id: string): T | undefined {
  const row = db()
    .prepare("SELECT data FROM records WHERE kind=? AND id=?")
    .get(kind, id);
  return row ? (JSON.parse(String(row.data)) as T) : undefined;
}
export function all<T>(kind: string): T[] {
  return db()
    .prepare("SELECT data FROM records WHERE kind=? ORDER BY rowid DESC")
    .all(kind)
    .map((row) => JSON.parse(String(row.data)) as T);
}
export function put<T extends { id: string }>(kind: string, value: T) {
  db()
    .prepare(
      "INSERT INTO records(kind,id,data) VALUES(?,?,?) ON CONFLICT(kind,id) DO UPDATE SET data=excluded.data",
    )
    .run(kind, value.id, JSON.stringify(value));
  return value;
}
export function remove(kind: string, id: string) {
  db().prepare("DELETE FROM records WHERE kind=? AND id=?").run(kind, id);
}

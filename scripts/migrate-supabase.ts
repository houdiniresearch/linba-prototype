import { DatabaseSync, backup } from "node:sqlite";
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { supabaseServer } from "../lib/supabase-server";
import { storePresentationDirectory } from "../lib/presentation-storage";
import {
  indexPresentation,
  presentationIndexState,
} from "../lib/document-index";
import type { Course } from "../lib/types";

async function main() {
  if (!process.argv.includes("--apply"))
    throw Error("Use --apply after reviewing the linked project.");
  if (process.env.SUPABASE_URL !== "https://wrkdfhbytobjwedcdczo.supabase.co")
    throw Error("Unexpected migration target.");
  process.env.LINBA_DATABASE = "supabase";
  const source = path.join(process.cwd(), ".linba");
  await mkdir(path.join(source, "backups"), { recursive: true });
  const sourceDb = new DatabaseSync(path.join(source, "linba.sqlite"), {
    readOnly: true,
  });
  const backupFile = path.join(
    source,
    "backups",
    `pre-supabase-${Date.now()}.sqlite`,
  );
  await backup(sourceDb, backupFile);
  const rows = sourceDb
    .prepare("select kind,id,data from records order by rowid")
    .all() as { kind: string; id: string; data: string }[];
  sourceDb.close();
  const courses = rows
    .filter((row) => row.kind === "course")
    .map((row) => JSON.parse(row.data) as Course);
  // Verify every page before any import; leave the original database untouched.
  for (const course of courses)
    for (const page of course.pages)
      await stat(path.join(source, "files", course.id, page.image));
  const client = supabaseServer();
  const existingRecords = new Map<string, unknown>();
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client
      .from("linba_records")
      .select("kind,id,data")
      .order("sequence")
      .range(offset, offset + 999);
    if (error) throw Error("Cannot inspect target records.");
    for (const row of data)
      existingRecords.set(JSON.stringify([row.kind, row.id]), row.data);
    if (data.length < 1000) break;
  }
  let imported = 0,
    skipped = 0;
  for (let offset = 0; offset < rows.length; offset += 100) {
    const batch = rows.slice(offset, offset + 100);
    const operations = [];
    for (const row of batch) {
      const existing = existingRecords.get(JSON.stringify([row.kind, row.id]));
      const data = JSON.parse(row.data);
      const canonical = (value: unknown): string =>
        JSON.stringify(value, (_key, value) =>
          value && typeof value === "object" && !Array.isArray(value)
            ? Object.fromEntries(
                Object.entries(value).sort(([a], [b]) => a.localeCompare(b)),
              )
            : value,
        );
      if (existing) {
        if (canonical(existing) !== canonical(data))
          throw Error(
            `Target record differs: ${row.kind}/${row.id}. Import stopped without overwriting it.`,
          );
        skipped++;
        continue;
      }
      operations.push({
        kind: row.kind,
        id: row.id,
        data,
        expected_version: 0,
      });
    }
    if (operations.length) {
      const { error } = await client.rpc("linba_mutate_records", {
        operations,
      });
      if (error) throw Error(`Record import failed: ${error.code}`);
      imported += operations.length;
    }
    console.log(
      `Records: ${Math.min(offset + 100, rows.length)}/${rows.length}`,
    );
  }
  let cursor = 0,
    files = 0;
  await Promise.all(
    Array.from({ length: 3 }, async () => {
      for (;;) {
        const course = courses[cursor++];
        if (!course) return;
        const directory = path.join(source, "files", course.id);
        if (
          !process.argv.includes("--skip-assets") ||
          !existingRecords.has(JSON.stringify(["course", course.id]))
        )
          await storePresentationDirectory(course.id, directory);
        files += (await readdir(directory, { withFileTypes: true })).filter(
          (item) => item.isFile(),
        ).length;
      }
    }),
  );
  console.log(
    `Private assets copied: ${files} files across ${courses.length} presentations.`,
  );
  cursor = 0;
  await Promise.all(
    Array.from({ length: 3 }, async () => {
      for (;;) {
        const course = courses[cursor++];
        if (!course) return;
        try {
          await indexPresentation(course.id);
        } catch {
          console.error("Retry needed for presentation index:", course.id);
        }
      }
    }),
  );
  const states = await Promise.all(
    courses
      .filter((course) => !course.trashedAt)
      .map((course) => presentationIndexState(course.id)),
  );
  const incomplete = states.filter(
    (state) => !state || !["ready", "empty"].includes(state.status),
  );
  const result = {
    target: process.env.SUPABASE_URL,
    imported,
    skipped,
    total: rows.length,
    presentations: courses.length,
    files,
    ready: states.filter((state) => state?.status === "ready").length,
    empty: states.filter((state) => state?.status === "empty").length,
    incomplete: incomplete.length,
    sourceFingerprint: createHash("sha256")
      .update(JSON.stringify(rows))
      .digest("hex"),
    backup: path.basename(backupFile),
    completedAt: new Date().toISOString(),
  };
  await writeFile(
    path.join(source, "supabase-migration.json"),
    JSON.stringify(result, null, 2),
    { mode: 0o600 },
  );
  console.log(JSON.stringify(result));
  if (incomplete.length)
    throw Error(
      "Indexing is incomplete; database provider has not been switched.",
    );
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Migration failed");
  process.exitCode = 1;
});

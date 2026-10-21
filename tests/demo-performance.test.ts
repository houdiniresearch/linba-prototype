import test from "node:test";
import assert from "node:assert/strict";
import { AssetCache } from "../lib/asset-cache";
import { ClientResourceCache } from "../lib/client-resource-cache";
import { slideSource } from "../lib/slide-source";

test("slide bytes coalesce, evict by size, retry failures and reject late invalidated fills", async () => {
  const cache = new AssetCache(6);
  let loads = 0;
  const load = async () => {
    loads++;
    return Buffer.from("abc");
  };
  await Promise.all([cache.read("a/1", load), cache.read("a/1", load)]);
  await cache.read("a/1", load);
  assert.equal(loads, 1);
  await cache.read("b/1", load);
  await cache.read("c/1", load);
  await cache.read("a/1", load);
  assert.equal(loads, 4);
  await assert.rejects(
    cache.read("fail", async () => {
      throw new Error("offline");
    }),
  );
  assert.equal((await cache.read("fail", load)).toString(), "abc");
  let finish!: (value: Buffer) => void;
  const pending = cache.read(
    "late/1",
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  cache.invalidate("late/");
  finish(Buffer.from("old"));
  await pending;
  assert.equal(
    (await cache.read("late/1", async () => Buffer.from("new"))).toString(),
    "new",
  );
});

test("resource snapshots deduplicate reads, refresh explicitly and clear on account/write boundaries", async () => {
  const cache = new ClientResourceCache();
  let reads = 0;
  const load = async () => ++reads;
  assert.deepEqual(
    await Promise.all([cache.read("auth", load), cache.read("auth", load)]),
    [1, 1],
  );
  assert.equal(await cache.read("auth", load), 1);
  assert.equal(await cache.read("auth", load, true), 2);
  let finish!: (value: string) => void;
  const oldAccount = cache.read(
    "courses",
    () =>
      new Promise<string>((resolve) => {
        finish = resolve;
      }),
  );
  cache.clear();
  finish("old private data");
  await oldAccount;
  assert.equal(cache.peek("auth"), undefined);
  assert.equal(cache.peek("courses"), undefined);
  await assert.rejects(
    cache.read("retry", async () => {
      throw new Error("offline");
    }),
  );
  assert.equal(await cache.read("retry", async () => "ok"), "ok");
});

test("only bundled examples use public slide assets; uploads retain private routes and tokens", () => {
  const example = {
    id: "demo",
    showcase: { pack: "bigg-v1", key: "market", theme: "dark" },
  } as const;
  assert.equal(
    slideSource(example, 2),
    "/showcase/materials/market/page-2.png",
  );
  assert.equal(
    slideSource({ id: "upload" }, 2, { participant: true }),
    "/api/participant/courses/upload/page/2",
  );
  assert.equal(
    slideSource({ id: "upload" }, 2, { displayKey: "a&b" }),
    "/api/courses/upload/page/2?key=a%26b",
  );
  assert.equal(slideSource(example, 99), "/api/courses/demo/page/99");
});

test("remote reads are scoped and coalesced per request, cloned, invalidated on commit and overlaid in a transaction", async (t) => {
  process.env.LINBA_DATABASE = "supabase";
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SECRET_KEY = "test-server-key";
  const calls: URL[] = [];
  const rows = new Map<
    string,
    {
      kind: string;
      id: string;
      data: { id: string; courseId: string };
      version: number;
    }
  >();
  rows.set("one", {
    kind: "question",
    id: "one",
    data: { id: "one", courseId: "course-a" },
    version: 1,
  });
  rows.set("two", {
    kind: "question",
    id: "two",
    data: { id: "two", courseId: "course-b" },
    version: 1,
  });
  t.mock.method(
    globalThis,
    "fetch",
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      calls.push(url);
      if (url.pathname.endsWith("/rpc/linba_mutate_records")) {
        const body = JSON.parse(String(init?.body));
        const changed = body.operations.map(
          (op: {
            kind: string;
            id: string;
            data: { id: string; courseId: string };
            expected_version: number | null;
          }) => {
            const existing = rows.get(op.id);
            if (op.expected_version !== null)
              assert.equal(op.expected_version, existing?.version);
            const row = {
              kind: op.kind,
              id: op.id,
              data: op.data,
              version: (existing?.version || 0) + 1,
            };
            rows.set(op.id, row);
            return row;
          },
        );
        return Response.json(changed);
      }
      let result = [...rows.values()].filter(
        (row) => `eq.${row.kind}` === url.searchParams.get("kind"),
      );
      if (url.searchParams.has("id")) {
        result = result.filter(
          (row) => `eq.${row.id}` === url.searchParams.get("id"),
        );
        return Response.json(result[0] || null);
      }
      if (url.searchParams.has("data->>courseId"))
        result = result.filter(
          (row) =>
            `eq.${row.data.courseId}` ===
            url.searchParams.get("data->>courseId"),
        );
      return Response.json(result);
    },
  );
  const { get, find, put, transaction, withDatabaseReadCache } =
    await import("../lib/db");
  type Record = { id: string; courseId: string };
  await withDatabaseReadCache(async () => {
    const before = calls.length;
    const [a, b] = await Promise.all([
      get<Record>("question", "one"),
      get<Record>("question", "one"),
    ]);
    assert.equal(calls.length - before, 1);
    assert.notEqual(a, b);
    a!.courseId = "changed locally";
    assert.equal(b!.courseId, "course-a");
    const filtered = await find<Record>("question", { courseId: "course-a" });
    assert.deepEqual(
      filtered.map((item) => item.id),
      ["one"],
    );
    assert.equal(
      calls.at(-1)!.searchParams.get("data->>courseId"),
      "eq.course-a",
    );
    await transaction(async () => {
      await put("question", { ...b!, courseId: "course-b" });
      assert.deepEqual(
        await find<Record>("question", { courseId: "course-a" }),
        [],
      );
      assert.equal(
        (await get<Record>("question", "one"))!.courseId,
        "course-b",
      );
    });
    assert.equal((await get<Record>("question", "one"))!.courseId, "course-b");
    assert.deepEqual(
      await find<Record>("question", { courseId: "course-a" }),
      [],
    );
  });
  const count = calls.length;
  await withDatabaseReadCache(() => get("question", "one"));
  assert.equal(
    calls.length,
    count + 1,
    "a different request must reauthorize using fresh records",
  );
  // A new demo installs four decks and hundreds of records in one RPC,
  // with zero Storage uploads. This guards the slowest first-entry regression.
  const { ensureShowcaseWorkspace } = await import("../lib/showcase-install");
  const { seedShowcaseRecords } = await import("../lib/showcase");
  const beforeInstall = calls.length;
  const installed = await withDatabaseReadCache(() =>
    ensureShowcaseWorkspace({
      id: "speed-account",
      name: "BIGG",
      email: "",
      role: "teacher",
      demo: true,
    }),
  );
  assert.equal(installed.length, 2);
  const installationCalls = calls.slice(beforeInstall);
  assert.equal(
    installationCalls.filter((url) =>
      url.pathname.endsWith("/rpc/linba_mutate_records"),
    ).length,
    1,
  );
  assert.ok(
    installationCalls.every((url) => !url.pathname.includes("/storage/")),
  );
  const course = await get<import("../lib/types").Course>(
    "course",
    installed[0].courseId,
  );
  const beforeStart = calls.length;
  await seedShowcaseRecords(course!);
  assert.equal(
    calls.length - beforeStart,
    1,
    "refreshing the live sample must batch all writes into a single RPC",
  );
});

import test from "node:test";
import assert from "node:assert/strict";
import { ClientResourceCache } from "../lib/client-resource-cache";
import type { Course } from "../lib/types";

test("team survives navigation and unrelated edits, and remains visible during background revalidation", async (t) => {
  let now = 100_000;
  t.mock.method(Date, "now", () => now);
  const cache = new ClientResourceCache();
  const key = "team?account=owner";
  const team = { team: { id: "one", name: "SUCool" }, members: [] };
  cache.set(key, team);
  cache.invalidateForMutation("courses/deck", { action: "notes" });
  let reads = 0;
  assert.equal(
    await cache.read(key, async () => {
      reads++;
      return team;
    }),
    team,
  );
  assert.equal(
    reads,
    0,
    "navigation with a fresh team must not request it again",
  );
  now += 31_000;
  assert.equal(cache.peek(key), undefined);
  assert.equal(
    cache.peek(key, true),
    team,
    "expired freshness must not erase the team",
  );
  let finish!: (value: typeof team) => void;
  const pending = cache.read(
    key,
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  assert.equal(cache.peek(key, true), team);
  const updated = { ...team, team: { ...team.team, name: "SUCool Lab" } };
  finish(updated);
  await pending;
  assert.equal(cache.peek(key), updated);
  await assert.rejects(
    cache.read(
      key,
      async () => {
        throw new Error("offline");
      },
      true,
    ),
  );
  assert.equal(
    cache.peek(key, true),
    updated,
    "temporary failure preserves the last successful view",
  );
});

test("a created or renamed team reaches every subscribed surface and beats an old GET", async () => {
  const cache = new ClientResourceCache();
  const key = "team?account=owner";
  cache.set(key, { team: null, members: [] });
  let notifications = 0;
  const unsubscribe = cache.subscribe(() => notifications++);
  let finish!: (value: unknown) => void;
  const oldRead = cache.read(
    key,
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
    true,
  );
  cache.invalidateForMutation("team");
  const created = {
    team: { id: "one", name: "SUCool" },
    members: [{ id: "owner" }],
    reports: [],
    ownReports: [],
    invites: [],
  };
  cache.commit("team", created);
  finish({ team: null, members: [] });
  await oldRead;
  assert.equal(cache.peek(key), created);
  let reads = 0;
  assert.equal(
    await cache.read(key, async () => {
      reads++;
      return created;
    }),
    created,
  );
  assert.equal(reads, 0);
  assert.ok(notifications > 0);
  unsubscribe();
  const count = notifications;
  cache.set(key, created);
  assert.equal(notifications, count);
});

test("folder, account, presentation and report snapshots revalidate independently", async () => {
  const cache = new ClientResourceCache();
  const values = {
    account: { plan: "early-access" },
    groups: { groups: [{ id: "folder" }] },
    reports: { course: { id: "report" } },
  };
  cache.set("account", values.account);
  cache.set("groups", values.groups);
  cache.set("reports/report", values.reports);
  cache.invalidateForMutation("groups/folder");
  assert.equal(cache.peek("account"), values.account);
  assert.equal(cache.peek("reports/report"), values.reports);
  assert.equal(cache.peek("groups"), undefined);
  assert.equal(cache.peek("groups", true), values.groups);
  await cache.read("groups", async () => ({
    groups: [{ id: "folder", name: "Sales" }],
  }));
  assert.deepEqual(cache.peek("groups"), {
    groups: [{ id: "folder", name: "Sales" }],
  });
});

test("account changes and logout clear all private snapshots, including late reads", async () => {
  const cache = new ClientResourceCache();
  cache.set("auth", { user: { id: "a" } });
  cache.set("team?account=a", { private: "team-a" });
  let finish!: (value: string) => void;
  const old = cache.read(
    "reports/private",
    () =>
      new Promise<string>((resolve) => {
        finish = resolve;
      }),
  );
  cache.set("auth", { user: { id: "b" } });
  finish("private-a");
  await old;
  assert.equal(cache.peek("team?account=a", true), undefined);
  assert.equal(cache.peek("reports/private", true), undefined);
  assert.deepEqual(cache.peek("auth"), { user: { id: "b" } });
  cache.set("account", { private: "b" });
  cache.invalidateForMutation("auth");
  assert.equal(cache.peek("account", true), undefined);
  assert.equal(cache.peek("auth", true), undefined);
});

test("successful presentation and profile writes update cached views immediately", () => {
  const cache = new ClientResourceCache();
  cache.set("auth", { user: { id: "owner", name: "BIGG" }, aiReady: true });
  cache.set("courses?account=owner", { courses: [] });
  const course = {
    id: "deck",
    ownerId: "owner",
    name: "New deck",
    pages: [{ number: 1 }],
    slides: [],
  } as unknown as Course;
  cache.commit("courses", { course });
  const list = cache.peek<{ courses: Course[] }>(
    "courses?account=owner",
    true,
  )!;
  assert.equal(list.courses[0].id, "deck");
  assert.equal(list.courses[0].createdBy, "BIGG");
  assert.equal(list.courses[0].coverPage, 1);
  assert.deepEqual(list.courses[0].pages, []);
  cache.commit("account", { user: { id: "owner", name: "Updated" } });
  assert.deepEqual(cache.peek("auth"), {
    user: { id: "owner", name: "Updated" },
    aiReady: true,
  });
});

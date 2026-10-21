import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { all, DATA_DIR, remove } from "../lib/db";
const base = process.env.LINBA_TEST_URL || "http://localhost:3000";
test("legacy URLs redirect to canonical English routes and preserve parameters", async () => {
  for (const [oldPath, destination] of [
    ["/giris", "/login"],
    ["/kesfet", "/explore"],
    ["/katil?kod=123456", "/join?kod=123456"],
    ["/rapor-asistani?rapor=example", "/report-agent?rapor=example"],
    ["/egitim/example", "/training/example"],
    ["/egitim/example/prova", "/training/example/practice"],
    ["/egitim/example/canli", "/training/example/live"],
    ["/egitim/example/onizleme", "/training/example/preview"],
    ["/sunum/example?key=token", "/present/example?key=token"],
  ]) {
    const response = await fetch(base + oldPath, { redirect: "manual" });
    assert.equal(response.status, 308, oldPath);
    assert.equal(
      new URL(response.headers.get("location")!, base).pathname +
        new URL(response.headers.get("location")!, base).search,
      destination,
    );
  }
  for (const [oldPath, destination] of [
    ["/login?mod=giris", "/login?mode=signin"],
    ["/join?egitim=example&kod=123456", "/join?training=example&code=123456"],
    ["/report-agent?rapor=example", "/report-agent?report=example"],
  ]) {
    const response = await fetch(base + oldPath, { redirect: "manual" });
    if (response.status === 307)
      assert.equal(response.headers.get("location"), destination);
    else {
      assert.equal(response.status, 200);
      const html = await response.text();
      assert(
        html.includes(`url=${destination.replaceAll("&", "&amp;")}`) ||
          html.includes(`url=${destination}`),
        oldPath,
      );
    }
  }
});
test("English product routes and authenticated thumbnail metadata keep access boundaries", async () => {
  let userId: string | undefined, trainingId: string | undefined;
  try {
    const registered = await fetch(base + "/api/auth", {
      method: "POST",
      headers: { Origin: base, "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "register",
        role: "teacher",
        name: "Product route test",
        email: `routes-${randomUUID()}@linba.test`,
        password: randomUUID(),
      }),
    });
    assert.equal(registered.status, 200);
    userId = (await registered.json()).user.id;
    const cookie = registered.headers.get("set-cookie")!.split(";")[0];
    const created = await fetch(base + "/api/courses", {
      method: "POST",
      headers: {
        Cookie: cookie,
        Origin: base,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        demo: true,
        name: "Product route test",
        accessDays: 7,
      }),
    });
    assert.equal(created.status, 200);
    const { course } = await created.json();
    trainingId = course.id;
    const list = await (
      await fetch(base + "/api/courses", { headers: { Cookie: cookie } })
    ).json();
    const summary = list.courses.find(
      (item: { id: string }) => item.id === trainingId,
    );
    assert.equal(summary.coverPage, course.pages[0].number);
    assert.deepEqual(summary.pages, []);
    assert.equal(summary.displayKey, "");
    assert.equal(summary.ownerId, "");
    const imagePath = `/api/courses/${trainingId}/page/${summary.coverPage}`;
    const image = await fetch(base + imagePath, {
      headers: { Cookie: cookie },
    });
    assert.equal(image.status, 200);
    assert.match(image.headers.get("content-type") || "", /image/);
    assert.equal((await fetch(base + imagePath)).status, 401);
    const projection = await fetch(
      base + imagePath + `?key=${course.displayKey}`,
    );
    assert.equal(projection.status, 200);
    for (const suffix of ["", "/practice", "/preview", "/live"]) {
      const response = await fetch(`${base}/training/${trainingId}${suffix}`, {
        headers: { Cookie: cookie },
      });
      assert.equal(response.status, 200, suffix);
    }
    assert.equal(
      (await fetch(`${base}/present/${trainingId}?key=${course.displayKey}`))
        .status,
      200,
    );
    assert.equal(
      (await fetch(`${base}/join?training=${trainingId}`)).status,
      200,
    );
    assert.equal(
      (await fetch(`${base}/report-agent`, { headers: { Cookie: cookie } }))
        .status,
      200,
    );
  } finally {
    if (trainingId) {
      await remove("course", trainingId);
      await rm(path.join(DATA_DIR, "files", trainingId), {
        recursive: true,
        force: true,
      });
    }
    if (userId) {
      for (const session of await all<{
        id: string;
        userId: string;
      }>("session"))
        if (session.userId === userId) await remove("session", session.id);
      await remove("user", userId);
    }
  }
});

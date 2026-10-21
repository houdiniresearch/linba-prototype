import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import path from "node:path";
import { all, DATA_DIR, get, put, remove } from "../lib/db";
import type { Course } from "../lib/types";
const base = process.env.LINBA_TEST_URL || "http://localhost:3000";
const users = new Set<string>();
function client() {
  let cookie = "";
  return async (endpoint: string, body?: object | FormData, status = 200) => {
    const multipart = body instanceof FormData;
    const response = await fetch(`${base}/api/${endpoint}`, {
      method: body ? "POST" : "GET",
      headers: {
        Cookie: cookie,
        Origin: base,
        ...(!multipart ? { "Content-Type": "application/json" } : {}),
      },
      body: multipart ? body : body ? JSON.stringify(body) : undefined,
    });
    const next = response.headers.get("set-cookie");
    if (next) cookie = next.split(";")[0];
    const data = await response.json();
    assert.equal(
      response.status,
      status,
      `${endpoint}: ${JSON.stringify(data)}`,
    );
    return data;
  };
}
// A single-page, self-contained PDF upload fixture (no real user document).
function pdf() {
  const stream = "BT /F1 24 Tf 50 200 Td (Folder creation QA) Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 338] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let data = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(data.length);
    data += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = data.length;
  data += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new File([data], "folder-creation.pdf", { type: "application/pdf" });
}
async function main() {
  const teacher = client(),
    other = client(),
    learner = client();
  try {
    for (const [request, role] of [
      [teacher, "teacher"],
      [other, "teacher"],
      [learner, "participant"],
    ] as const) {
      const { user } = await request("auth", {
        action: "register",
        role,
        name: "Activation QA",
        email: `activation-${randomUUID()}@linba.test`,
        password: randomUUID(),
      });
      users.add(user.id);
    }
    const folder = (await teacher("groups", { name: "Sales" })).group;
    const foreign = (await other("groups", { name: "Private" })).group;
    const { course } = await teacher("courses", {
      demo: true,
      name: "Training in Sales",
      folderId: folder.id,
    });
    assert.equal(course.groupId, folder.id);
    assert.equal((await get<Course>("course", course.id))?.groupId, folder.id);
    const before = (await all<Course>("course")).length;
    await teacher("courses", { demo: true, folderId: foreign.id }, 404);
    await teacher("courses", { demo: true, folderId: 42 }, 400);
    await learner("courses", { demo: true, folderId: folder.id }, 403);
    assert.equal(
      (await all<Course>("course")).length,
      before,
      "invalid destinations do not create unfiled trainings",
    );
    const upload = new FormData();
    upload.set("file", pdf());
    upload.set("name", "Uploaded training in Sales");
    upload.set("folderId", folder.id);
    upload.set("accessDays", "0");
    upload.set("autoAnswer", "false");
    const uploaded = (await teacher("courses", upload)).course;
    assert.equal(uploaded.groupId, folder.id);
    assert.equal(uploaded.name, "Uploaded training in Sales");
    assert.equal(uploaded.accessDays, 0);
    assert.equal(uploaded.autoAnswer, false);
    assert.equal(uploaded.pages.length, 1);
    upload.set("folderId", foreign.id);
    await teacher("courses", upload, 404);
    const unfiled = (await teacher("courses", { demo: true, folderId: "" }))
      .course;
    assert.equal(unfiled.groupId, undefined);
    await put("course", {
      ...(await get<Course>("course", course.id))!,
      status: "ended",
      endedAt: new Date().toISOString(),
    });
    const repeated = await teacher(`courses/${course.id}/repeat`, {
      requestId: randomUUID(),
    });
    assert.equal(repeated.course.groupId, folder.id);
    console.log(
      "Activation HTTP checks passed: sample/upload destination, ownership, invalid-folder rejection, unfiled creation and folder inheritance.",
    );
  } finally {
    const courses = (await all<Course>("course")).filter((course) =>
      users.has(course.ownerId),
    );
    const ids = new Set(courses.map((course) => course.id));
    for (const kind of ["session", "training-group", "training-repeat"]) {
      for (const item of await all<{
        id: string;
        userId?: string;
        ownerId?: string;
        sourceId?: string;
      }>(kind))
        if (
          users.has(item.userId || "") ||
          users.has(item.ownerId || "") ||
          ids.has(item.sourceId || "")
        )
          await remove(kind, item.id);
    }
    for (const course of courses) {
      await remove("course", course.id);
      await rm(path.join(DATA_DIR, "files", course.id), {
        recursive: true,
        force: true,
      });
    }
    for (const id of users) await remove("user", id);
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

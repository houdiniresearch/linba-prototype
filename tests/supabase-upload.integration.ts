import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { all, remove } from "../lib/db";
import { discardPresentationAssets } from "../lib/presentation-storage";
import { supabaseServer, usesSupabase } from "../lib/supabase-server";
const base = process.env.LINBA_TEST_URL || "http://127.0.0.1:3002";
const paidAI = process.env.LINBA_TEST_PAID_AI === "1";
const verifyIndex = paidAI || process.env.LINBA_TEST_VERIFY_INDEX === "1";
const format = process.env.LINBA_TEST_UPLOAD_FORMAT === "pptx" ? "pptx" : "pdf";
const fixture =
  process.env.LINBA_TEST_PRESENTATION === "market" ? "market" : "customer";
const users = new Set<string>(),
  courses = new Set<string>(),
  uploads = new Set<string>();
function client() {
  const jar = new Map<string, string>();
  return async (
    endpoint: string,
    body?: object,
    status = 200,
    method = body ? "POST" : "GET",
  ) => {
    const response = await fetch(`${base}/api/${endpoint}`, {
      method,
      headers: {
        Origin: base,
        Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; "),
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    for (const header of response.headers.getSetCookie()) {
      const pair = header.split(";")[0],
        idx = pair.indexOf("=");
      jar.set(pair.slice(0, idx), pair.slice(idx + 1));
    }
    const data = await response.json();
    assert.equal(
      response.status,
      status,
      `${endpoint}: ${data.error || "request failed"} (${response.status})`,
    );
    return data;
  };
}
async function main() {
  if (!usesSupabase())
    throw Error(
      "Set LINBA_DATABASE=supabase. Run the test server with OPENAI_API_KEY empty.",
    );
  const teacher = client(),
    other = client(),
    guest = client();
  try {
    for (const request of [teacher, other]) {
      const { user } = await request("auth", {
        action: "register",
        role: "teacher",
        name: "Upload integration",
        email: `upload-${randomUUID()}@linba.test`,
        password: randomUUID(),
      });
      users.add(user.id);
    }
    await teacher("uploads", { name: "malware.zip", size: 100 }, 400);
    await teacher("uploads", { name: "huge.pdf", size: 31 * 1024 * 1024 }, 400);
    const bytes = await readFile(
      format === "pptx"
        ? `tests/fixtures/presentations/${fixture}.pptx`
        : `public/showcase/materials/${fixture}/${fixture}-materials.pdf`,
    );
    const ticket = await teacher("uploads", {
      name: `integration.${format}`,
      size: bytes.length,
    });
    uploads.add(ticket.uploadId);
    assert.equal(ticket.direct, true);
    const transferred = await fetch(ticket.signedUrl, {
      method: "PUT",
      headers: {
        "Content-Type":
          format === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      },
      body: bytes,
    });
    assert.equal(transferred.status, 200);
    await other(
      "courses",
      { uploadId: ticket.uploadId, name: "Not mine" },
      404,
    );
    const { course } = await teacher("courses", {
      uploadId: ticket.uploadId,
      name: `Portable ${format} QA`,
      autoAnswer: paidAI,
      accessDays: 7,
    });
    courses.add(course.id);
    assert.equal(course.pages.length, 8);
    assert.match(
      course.pages[0].title,
      fixture === "customer" ? /Müşteriyi.*Anlamak/ : /Pazar.*Analizi/,
    );
    assert.ok(
      course.pages.some((page: { text: string }) =>
        page.text.includes(fixture === "customer" ? "Görüşme" : "SOM"),
      ),
    );
    const again = await teacher("courses", {
      uploadId: ticket.uploadId,
      name: "Retry",
    });
    assert.equal(again.course.id, course.id);
    const participant = await guest("participant/join", {
      asGuest: true,
      code: course.code,
      nickname: "Upload guest",
    });
    users.add(participant.user.id);
    const state = await guest(`participant/courses/${course.id}`);
    assert.equal(state.course.pages.length, 8);
    const original = await supabaseServer()
      .storage.from("linba-presentations")
      .download(`${course.id}/presentation.${format}`);
    assert.equal(original.error, null);
    assert.equal(original.data!.size, bytes.length);
    if (format === "pptx") {
      const converted = await supabaseServer()
        .storage.from("linba-presentations")
        .download(`${course.id}/presentation.pdf`);
      assert.equal(converted.error, null);
      assert.ok(converted.data!.size > 1000);
    }
    const image = await supabaseServer()
      .storage.from("linba-presentations")
      .download(`${course.id}/${course.pages[0].image}`);
    assert.equal(image.error, null);
    assert.ok(image.data!.size > 1000);
    if (verifyIndex) {
      const deadline = Date.now() + 60_000;
      let ready = false;
      while (Date.now() < deadline) {
        const state = await supabaseServer()
          .from("linba_documents")
          .select("status,chunk_count")
          .eq("course_id", course.id)
          .single();
        if (state.data?.status === "ready") {
          ready = state.data.chunk_count > 0;
          break;
        }
        if (state.data?.status === "error")
          throw Error("New upload indexing failed.");
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      assert.equal(
        ready,
        true,
        "New uploads must produce a ready vector index.",
      );
    }
    if (paidAI) {
      await teacher(`courses/${course.id}`, { action: "start" }, 200, "PATCH");
      for (const text of ["Merhaba!", "Bana kek tarifi yaz."]) {
        const { question } = await guest(
          `participant/courses/${course.id}/questions`,
          { text },
        );
        assert.equal(question.status, "answered");
        assert.equal(question.conversationOnly, true);
        assert.equal(question.sources.length, 0);
        assert.ok(question.answer);
        assert.ok(!question.answer.includes("eğitmene iletildi"));
      }
      for (const text of [
        "Bu sunum ne hakkında?",
        "Müşteri görüşmesinde nelere dikkat etmeliyim?",
      ]) {
        const { question } = await guest(
          `participant/courses/${course.id}/questions`,
          { text },
        );
        assert.equal(question.status, "answered", text);
        assert.ok(question.answer, text);
        assert.ok(question.sources.length > 0, text);
        assert.ok(!question.conversationOnly);
      }
      assert.equal(
        (await teacher(`courses/${course.id}`)).questions.length,
        2,
        "Social/off-topic chat must not appear in instructor questions or reports.",
      );
      assert.equal(
        (await guest(`participant/courses/${course.id}`)).questions.length,
        4,
      );
    }
    console.log(
      `PASS (${fixture}/${format}): signed private upload, size/type validation, ownership, portable parsing/rendering, durable original/images, idempotent completion and participant access. ${paidAI ? "Ready pgvector index, two grounded AI answers, private greeting/off-topic replies and analytics isolation verified with live OpenAI." : verifyIndex ? "Ready pgvector index verified; no text/voice model calls." : "Run with OpenAI disabled for a provider-free test."}`,
    );
  } finally {
    for (const id of courses) await discardPresentationAssets(id);
    await supabaseServer()
      .from("linba_documents")
      .delete()
      .in("course_id", [...courses]);
    for (const kind of [
      "course",
      "member",
      "question",
      "response",
      "session",
      "user",
      "presentation-upload",
    ])
      for (const record of await all<{
        id: string;
        userId?: string;
        courseId?: string;
      }>(kind))
        if (
          courses.has(record.id) ||
          users.has(record.id) ||
          uploads.has(record.id) ||
          users.has(record.userId || "") ||
          courses.has(record.courseId || "")
        )
          await remove(kind, record.id);
    for (const upload of uploads) {
      const { data } = await supabaseServer()
        .storage.from("linba-presentations")
        .list(`incoming/${upload}`);
      if (data?.length)
        await supabaseServer()
          .storage.from("linba-presentations")
          .remove(data.map((item) => `incoming/${upload}/${item.name}`));
    }
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

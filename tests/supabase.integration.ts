import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { all, get, put, remove, transaction } from "../lib/db";
import { supabaseServer, usesSupabase } from "../lib/supabase-server";
import {
  readPresentationAsset,
  discardPresentationAssets,
} from "../lib/presentation-storage";

async function main() {
  if (!usesSupabase())
    throw Error("Set LINBA_DATABASE=supabase for this integration test.");
  const prefix = `integration-${randomUUID()}`,
    kind = "integration-probe";
  const ids = [`${prefix}-one`, `${prefix}-two`, `${prefix}-rollback`];
  const client = supabaseServer();
  const vector = Array(1536).fill(0);
  vector[0] = 1;
  try {
    await put(kind, { id: ids[0], value: 1 });
    const first = (await get<{ id: string; value: number }>(kind, ids[0]))!,
      stale = (await get<{ id: string; value: number }>(kind, ids[0]))!;
    first.value = 2;
    await put(kind, first);
    stale.value = 3;
    await assert.rejects(put(kind, stale), /record changed/i);
    assert.equal((await get<{ value: number }>(kind, ids[0]))!.value, 2);
    await assert.rejects(
      transaction(async () => {
        await put(kind, { id: ids[2], value: 1 });
        throw Error("rollback");
      }),
      /rollback/,
    );
    assert.equal(await get(kind, ids[2]), undefined);
    await assert.rejects(
      transaction(async () => {
        await put(kind, { id: ids[2], value: 1 });
        await put(kind, stale);
      }),
      /record changed/i,
    );
    assert.equal(await get(kind, ids[2]), undefined);
    await remove(kind, ids[0]);
    await assert.rejects(put(kind, first), /record changed/i);
    for (const id of ids.slice(0, 2)) {
      const generation = randomUUID();
      const state = await client
        .from("linba_documents")
        .insert({
          course_id: id,
          content_hash: id,
          generation_id: generation,
          status: "processing",
          embedding_model: "fixture",
          dimensions: 1536,
          parser_version: "fixture",
          page_count: 1,
        });
      assert.equal(state.error, null);
      const published = await client.rpc("linba_publish_document", {
        target_course: id,
        target_generation: generation,
        chunks: [
          {
            index: 0,
            page: 1,
            title: "Private synthetic test",
            content: `Only belongs to ${id}`,
            embedding: vector,
          },
        ],
      });
      assert.equal(published.error, null);
      assert.equal(published.data, true);
      const staleJob = await client.rpc("linba_publish_document", {
        target_course: id,
        target_generation: randomUUID(),
        chunks: [],
      });
      assert.equal(staleJob.data, false);
    }
    const search = await client.rpc("linba_search_document", {
      target_course: ids[0],
      target_hash: ids[0],
      query_text: "synthetic",
      query_embedding: vector,
      result_limit: 7,
    });
    assert.equal(search.error, null);
    assert.equal(search.data.length, 1);
    assert.ok(search.data[0].content.includes(ids[0]));
    assert.ok(!search.data[0].content.includes(ids[1]));
    const staleHash = await client.rpc("linba_search_document", {
      target_course: ids[0],
      target_hash: "old-hash",
      query_text: "synthetic",
      query_embedding: vector,
    });
    assert.deepEqual(staleHash.data, []);
    const asset = "fixture.svg";
    const uploaded = await client.storage
      .from("linba-presentations")
      .upload(
        `${prefix}/${asset}`,
        Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>',
        ),
        { contentType: "image/svg+xml" },
      );
    assert.equal(uploaded.error, null);
    assert.match(
      (await readPresentationAsset(prefix, asset)).toString(),
      /<svg/,
    );
    const publicAccess = await fetch(
      `${process.env.SUPABASE_URL}/storage/v1/object/public/linba-presentations/${prefix}/${asset}`,
    );
    assert.notEqual(publicAccess.status, 200);
    await assert.rejects(
      readPresentationAsset(prefix, "../other.svg"),
      /invalid/i,
    );
    console.log(
      "PASS: persistent records, stale-write rejection, no deleted-record resurrection, atomic rollback, private assets, generation fencing and presentation-scoped vector search.",
    );
  } finally {
    for (const row of (await all<{ id: string }>(kind)).filter((row) =>
      row.id.startsWith(prefix),
    ))
      await remove(kind, row.id);
    await client.from("linba_documents").delete().in("course_id", ids);
    await discardPresentationAssets(prefix);
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

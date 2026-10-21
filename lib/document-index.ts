import { createHash, randomUUID } from "node:crypto";
import { get } from "./db";
import { supabaseServer, usesSupabase } from "./supabase-server";
import type { Course, Page } from "./types";
import type { SourceChunk } from "./ai-retrieval";

export const EMBEDDING_DIMENSIONS = 1536;
export const DOCUMENT_PARSER_VERSION = "slides-v1";
export function embeddingModel() {
  return process.env.OPENAI_EMBEDDING_MODEL?.trim() || "text-embedding-3-small";
}
export function documentHash(pages: Page[]) {
  return createHash("sha256")
    .update(
      JSON.stringify([
        DOCUMENT_PARSER_VERSION,
        embeddingModel(),
        EMBEDDING_DIMENSIONS,
        pages.map((p) => [p.number, p.title, p.text]),
      ]),
    )
    .digest("hex");
}
export function documentChunks(pages: Page[]) {
  const chunks: {
    index: number;
    page: number;
    title: string;
    content: string;
  }[] = [];
  for (const page of pages) {
    const text = page.text.replace(/\u0000/gu, "").trim();
    if (!text) continue;
    for (let start = 0; start < text.length;) {
      let end = Math.min(start + 2400, text.length);
      if (end < text.length) {
        const boundary = text.lastIndexOf(" ", end);
        if (boundary > start + 1600) end = boundary;
      }
      chunks.push({
        index: chunks.length,
        page: page.number,
        title: page.title,
        content: text.slice(start, end).trim(),
      });
      if (end === text.length) break;
      start = end - 240;
    }
  }
  return chunks;
}
export async function embedTexts(input: string[]): Promise<number[][]> {
  if (!input.length) return [];
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("INDEX_AI_NOT_CONFIGURED");
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: embeddingModel(),
          dimensions: EMBEDDING_DIMENSIONS,
          input,
          encoding_format: "float",
        }),
        signal: AbortSignal.timeout(30_000),
        cache: "no-store",
      });
      if (!response.ok) {
        if (
          attempt < 2 &&
          (response.status === 429 || response.status >= 500)
        ) {
          await new Promise((resolve) =>
            setTimeout(resolve, 500 * 2 ** attempt),
          );
          continue;
        }
        throw new Error(`INDEX_EMBEDDING_HTTP_${response.status}`);
      }
      const body = (await response.json()) as {
        data?: { index: number; embedding: number[] }[];
      };
      const sorted = body.data?.sort((a, b) => a.index - b.index);
      if (
        !sorted ||
        sorted.length !== input.length ||
        sorted.some(
          (row, index) =>
            row.index !== index ||
            row.embedding?.length !== EMBEDDING_DIMENSIONS ||
            row.embedding.some((value) => !Number.isFinite(value)),
        )
      )
        throw new Error("INDEX_INVALID_EMBEDDING");
      return sorted.map((row) => row.embedding);
    } catch (error) {
      if (
        attempt === 2 ||
        (error instanceof Error && error.message.startsWith("INDEX_"))
      )
        throw error;
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
    }
  }
  throw new Error("INDEX_EMBEDDING_FAILED");
}
type IndexState = {
  course_id: string;
  content_hash: string;
  generation_id: string;
  status: "queued" | "processing" | "ready" | "error" | "empty";
  attempts: number;
  updated_at: string;
  started_at?: string;
  chunk_count: number;
  error_code?: string;
};
export async function presentationIndexState(
  courseId: string,
): Promise<IndexState | undefined> {
  if (!usesSupabase()) return;
  const { data, error } = await supabaseServer()
    .from("linba_documents")
    .select(
      "course_id,content_hash,generation_id,status,attempts,updated_at,started_at,chunk_count,error_code",
    )
    .eq("course_id", courseId)
    .maybeSingle();
  if (error) throw new Error("INDEX_STATE_UNAVAILABLE");
  return data || undefined;
}
export async function queuePresentationIndex(course: Course, force = false) {
  if (!usesSupabase() || course.trashedAt) return;
  const current = await presentationIndexState(course.id),
    hash = documentHash(course.pages);
  if (
    !force &&
    current?.content_hash === hash &&
    (["queued", "ready", "empty"].includes(current.status) ||
      (current.status === "processing" &&
        Date.now() - Date.parse(current.started_at || current.updated_at) <
          180_000) ||
      (current.status === "error" &&
        (current.attempts >= 3 ||
          Date.now() - Date.parse(current.updated_at) < 30_000)))
  )
    return current;
  const next = {
    course_id: course.id,
    content_hash: hash,
    generation_id: randomUUID(),
    status: "queued" as const,
    embedding_model: embeddingModel(),
    dimensions: EMBEDDING_DIMENSIONS,
    parser_version: DOCUMENT_PARSER_VERSION,
    page_count: course.pages.length,
    chunk_count: 0,
    attempts: current?.content_hash === hash ? current.attempts : 0,
    started_at: null,
    updated_at: new Date().toISOString(),
    error_code: null,
  };
  const { error } = await supabaseServer().from("linba_documents").upsert(next);
  if (error) throw new Error("INDEX_QUEUE_FAILED");
  return next;
}
export async function indexPresentation(courseId: string) {
  if (!usesSupabase()) return;
  const course = await get<Course>("course", courseId);
  if (!course || course.trashedAt) return;
  const state = await queuePresentationIndex(course);
  if (!state || state.status !== "queued") return;
  const { data, error } = await supabaseServer()
    .from("linba_documents")
    .update({
      status: "processing",
      started_at: new Date().toISOString(),
      attempts: state.attempts + 1,
    })
    .eq("course_id", courseId)
    .eq("generation_id", state.generation_id)
    .eq("status", "queued")
    .select("generation_id");
  if (error) throw new Error("INDEX_CLAIM_FAILED");
  if (!data.length) return; // Another process owns this generation.
  try {
    const reused = await supabaseServer().rpc("linba_copy_document_index", {
      target_course: courseId,
      target_generation: state.generation_id,
      target_hash: state.content_hash,
    });
    if (reused.error) throw new Error("INDEX_REUSE_FAILED");
    if (reused.data === true) return;
    const chunks = documentChunks(course.pages),
      vectors: number[][] = [];
    for (let start = 0; start < chunks.length; start += 32) {
      vectors.push(
        ...(await embedTexts(
          chunks
            .slice(start, start + 32)
            .map((chunk) => `${chunk.title}\n${chunk.content}`),
        )),
      );
    }
    const { error: publishError } = await supabaseServer().rpc(
      "linba_publish_document",
      {
        target_course: courseId,
        target_generation: state.generation_id,
        chunks: chunks.map((chunk, index) => ({
          ...chunk,
          embedding: vectors[index],
        })),
      },
    );
    if (publishError) throw new Error("INDEX_PUBLISH_FAILED");
  } catch (error) {
    const code =
      error instanceof Error && /^INDEX_[A-Z0-9_]+$/u.test(error.message)
        ? error.message
        : "INDEX_PROCESSING_FAILED";
    await supabaseServer()
      .from("linba_documents")
      .update({
        status: "error",
        error_code: code,
        updated_at: new Date().toISOString(),
      })
      .eq("course_id", courseId)
      .eq("generation_id", state.generation_id);
    console.error("[linba.index]", courseId, code);
  }
}
/** Course filtering happens inside SQL before ranking. No cross-course results. */
export async function searchPresentation(
  course: Course,
  query: string,
): Promise<SourceChunk[] | undefined> {
  if (!usesSupabase()) return;
  const state = await presentationIndexState(course.id);
  if (
    state?.status !== "ready" ||
    state.content_hash !== documentHash(course.pages)
  )
    return;
  const [vector] = await embedTexts([query.slice(0, 3000)]);
  const { data, error } = await supabaseServer().rpc("linba_search_document", {
    target_course: course.id,
    target_hash: state.content_hash,
    query_text: query,
    query_embedding: vector,
    result_limit: 7,
  });
  if (error) throw new Error("INDEX_SEARCH_FAILED");
  return (
    data as {
      page_number: number;
      title: string;
      content: string;
      score: number;
    }[]
  ).map((row) => ({
    page: row.page_number,
    title: row.title,
    content: row.content,
    score: row.score,
  }));
}

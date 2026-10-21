import { randomUUID } from "node:crypto";
import { AppError } from "./auth";
import { get, put } from "./db";
import { supabaseServer, usesSupabase } from "./supabase-server";
import type { User } from "./types";

type Upload = {
  id: string;
  userId: string;
  name: string;
  size: number;
  path: string;
  expiresAt: number;
  courseId?: string;
  processingAt?: number;
};
export async function createPresentationUpload(
  user: User,
  body: { name?: unknown; size?: unknown },
) {
  if (user.role !== "teacher")
    throw new AppError("This area is unavailable for this account type.", 403);
  if (!usesSupabase()) return { direct: false as const };
  if (
    typeof body.name !== "string" ||
    !/\.(pdf|pptx)$/iu.test(body.name) ||
    body.name.length > 255 ||
    typeof body.size !== "number" ||
    !Number.isInteger(body.size) ||
    body.size < 10 ||
    body.size > 30 * 1024 * 1024
  )
    throw new AppError("Choose a PDF or PPTX file up to 30 MB.");
  const id = randomUUID(),
    extension = body.name.toLowerCase().endsWith(".pdf") ? "pdf" : "pptx";
  const objectPath = `incoming/${id}/presentation.${extension}`;
  const { data, error } = await supabaseServer()
    .storage.from("linba-presentations")
    .createSignedUploadUrl(objectPath);
  if (error || !data)
    throw new AppError(
      "The file could not be uploaded. Please try again.",
      502,
    );
  await put<Upload>("presentation-upload", {
    id,
    userId: user.id,
    name: body.name,
    size: body.size,
    path: objectPath,
    expiresAt: Date.now() + 20 * 60_000,
  });
  return { direct: true as const, uploadId: id, signedUrl: data.signedUrl };
}
export async function presentationUpload(user: User, id: unknown) {
  if (typeof id !== "string" || !/^[a-f0-9-]{36}$/iu.test(id))
    throw new AppError("Choose your presentation file.");
  const upload = await get<Upload>("presentation-upload", id);
  if (!upload || upload.userId !== user.id)
    throw new AppError("Presentation upload not found.", 404);
  if (!upload.courseId && upload.expiresAt < Date.now())
    throw new AppError(
      "This upload expired. Please select the file again.",
      410,
    );
  return upload;
}
export async function uploadedPresentationFile(upload: Upload) {
  if (upload.processingAt && Date.now() - upload.processingAt < 240_000)
    throw new AppError("This presentation is already being processed.", 409);
  Object.assign(
    upload,
    await put("presentation-upload", { ...upload, processingAt: Date.now() }),
  );
  const { data, error } = await supabaseServer()
    .storage.from("linba-presentations")
    .download(upload.path);
  if (error || !data || data.size !== upload.size)
    throw new AppError(
      "The file could not be uploaded. Please try again.",
      422,
    );
  return new File([await data.arrayBuffer()], upload.name, { type: data.type });
}
export async function completePresentationUpload(
  upload: Upload,
  courseId: string,
) {
  await put("presentation-upload", { ...upload, courseId });
}
/** Call after the course + ticket transaction commits, never before publication. */
export async function cleanupPresentationUpload(upload: Upload) {
  const { error } = await supabaseServer()
    .storage.from("linba-presentations")
    .remove([upload.path]);
  if (error)
    console.info("[linba.upload]", upload.id, "temporary_cleanup_pending");
}

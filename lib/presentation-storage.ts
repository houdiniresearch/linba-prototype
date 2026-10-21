import { readFile, writeFile, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import type { Course } from "./types";
import { DATA_DIR } from "./db";
import { supabaseServer, usesSupabase } from "./supabase-server";

import { AssetCache } from "./asset-cache";
const assets = new AssetCache();
const bucket = "linba-presentations";
function objectKey(courseId: string, file: string) {
  if (
    !/^[\w:-]{1,200}$/u.test(courseId) ||
    !file ||
    path.basename(file) !== file ||
    file === "." ||
    file === ".."
  )
    throw new Error("Invalid presentation asset path.");
  return `${courseId}/${file}`;
}
function mime(file: string) {
  return file.endsWith(".svg")
    ? "image/svg+xml"
    : file.endsWith(".png")
      ? "image/png"
      : file.endsWith(".pdf")
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.presentationml.presentation";
}
export async function readPresentationAsset(
  courseId: string,
  file: string,
  example?: Course["showcase"],
) {
  const key = objectKey(courseId, file);
  if (
    example?.pack === "bigg-v1" &&
    ["customer", "market"].includes(example.key) &&
    /^page-[1-8]\.png$/.test(file)
  )
    return readFile(
      path.join(process.cwd(), "public/showcase/materials", example.key, file),
    );
  if (!usesSupabase()) return readFile(path.join(DATA_DIR, "files", key));
  return assets.read(key, async () => {
    const { data, error } = await supabaseServer()
      .storage.from(bucket)
      .download(key);
    if (error || !data) throw new Error("Presentation asset unavailable.");
    return Buffer.from(await data.arrayBuffer());
  });
}
export async function storePresentationDirectory(
  courseId: string,
  directory = path.join(DATA_DIR, "files", courseId),
) {
  if (!usesSupabase()) return;
  assets.invalidate(`${courseId}/`);
  const files = (
    await readdir(/* turbopackIgnore: true */ directory, {
      withFileTypes: true,
    })
  ).filter((file) => file.isFile());
  // Bound memory and outgoing requests for large decks.
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(4, files.length) }, async () => {
      for (;;) {
        const file = files[next++];
        if (!file) return;
        const { error } = await supabaseServer()
          .storage.from(bucket)
          .upload(
            objectKey(courseId, file.name),
            await readFile(path.join(directory, file.name)),
            {
              upsert: true,
              contentType: mime(file.name),
              cacheControl: "3600",
            },
          );
        if (error) throw new Error("Presentation assets could not be stored.");
        assets.invalidate(objectKey(courseId, file.name));
      }
    }),
  );
}
export async function copyPresentationAsset(
  sourceId: string,
  targetId: string,
  file: string,
) {
  const source = objectKey(sourceId, file),
    target = objectKey(targetId, file);
  if (usesSupabase()) {
    const { error } = await supabaseServer()
      .storage.from(bucket)
      .copy(source, target);
    if (error) throw new Error("Presentation assets could not be copied.");
  } else {
    await mkdir(path.join(DATA_DIR, "files", targetId), { recursive: true });
    await writeFile(
      path.join(DATA_DIR, "files", target),
      await readFile(path.join(DATA_DIR, "files", source)),
    );
  }
}
/** Only used for a new upload/copy that failed before it could be published. */
export async function discardPresentationAssets(courseId: string) {
  objectKey(courseId, "validate");
  assets.invalidate(`${courseId}/`);
  if (usesSupabase()) {
    const { data, error } = await supabaseServer()
      .storage.from(bucket)
      .list(courseId, { limit: 1000 });
    if (error) throw new Error("Presentation cleanup failed.");
    if (data?.length) {
      const { error: removalError } = await supabaseServer()
        .storage.from(bucket)
        .remove(data.map((file) => objectKey(courseId, file.name)));
      if (removalError) throw new Error("Presentation cleanup failed.");
    }
  }
  await rm(path.join(DATA_DIR, "files", courseId), {
    recursive: true,
    force: true,
  });
}

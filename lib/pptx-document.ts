import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** Each conversion gets its own Office profile, so concurrent requests cannot
 * attach to another user's process or silently skip their document. */
export async function convertPptxToPdf(input: string, directory: string) {
  const job = await mkdtemp(path.join(directory, "office-"));
  try {
    const binary = process.env.LINBA_SOFFICE_BINARY || "soffice";
    const args = [
      `-env:UserInstallation=${pathToFileURL(path.join(job, "profile")).href}`,
      "--headless",
      "--nologo",
      "--nodefault",
      "--norestore",
      "--convert-to",
      "pdf:impress_pdf_Export",
      "--outdir",
      job,
      input,
    ];
    await new Promise<void>((resolve, reject) => {
      const child = spawn(/* turbopackIgnore: true */ binary, args, {
        stdio: "ignore",
        detached: process.platform !== "win32",
      });
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        try {
          if (child.pid && process.platform !== "win32")
            process.kill(-child.pid, "SIGKILL");
          else child.kill("SIGKILL");
        } catch {
          /* The process may have exited just before the deadline. */
        }
      }, 80_000);
      child.once("error", () => {
        clearTimeout(timer);
        reject(new Error("PPTX_CONVERTER_UNAVAILABLE"));
      });
      child.once("close", (code) => {
        clearTimeout(timer);
        if (timedOut) reject(new Error("PPTX_CONVERSION_TIMEOUT"));
        else if (code !== 0) reject(new Error("PPTX_CONVERSION_FAILED"));
        else resolve();
      });
    });
    const output = path.join(
      job,
      path.basename(input, path.extname(input)) + ".pdf",
    );
    const metadata = await stat(output);
    if (metadata.size < 10 || metadata.size > 100 * 1024 * 1024)
      throw new Error("PPTX_INVALID_OUTPUT");
    const bytes = await readFile(output);
    if (bytes.subarray(0, 4).toString() !== "%PDF")
      throw new Error("PPTX_INVALID_OUTPUT");
    return bytes;
  } finally {
    await rm(job, { recursive: true, force: true });
  }
}

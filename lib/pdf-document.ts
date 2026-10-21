import { writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Page } from "./types";

/** Node-native PDF parsing/rasterization; no Python, Poppler or external service. */
export async function processPdf(
  bytes: Buffer,
  directory: string,
): Promise<Page[]> {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // Runtime assets are explicitly included in Next's server file trace.
  // require.resolve is unsuitable here: Turbopack returns a module identifier.
  const resources = path.join(process.cwd(), "node_modules/pdfjs-dist");
  const loading = getDocument({
    data: new Uint8Array(bytes),
    useSystemFonts: true,
    cMapUrl: path.join(resources, "cmaps") + path.sep,
    cMapPacked: true,
    standardFontDataUrl: path.join(resources, "standard_fonts") + path.sep,
  });
  try {
    const pdf = await loading.promise;
    if (pdf.numPages < 1 || pdf.numPages > 80)
      throw new Error("Presentation must contain 1–80 slides.");
    const factory = pdf.canvasFactory as {
      create(
        width: number,
        height: number,
      ): {
        canvas: { toBuffer(type: "image/png"): Buffer };
        context: CanvasRenderingContext2D;
      };
      destroy(value: unknown): void;
    };
    const pages: Page[] = [];
    for (let number = 1; number <= pdf.numPages; number++) {
      const page = await pdf.getPage(number),
        natural = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({
        scale: 1600 / Math.max(natural.width, natural.height),
      });
      const canvas = factory.create(
        Math.ceil(viewport.width),
        Math.ceil(viewport.height),
      );
      try {
        await page.render({
          canvas: canvas.canvas as unknown as HTMLCanvasElement,
          canvasContext: canvas.context,
          viewport,
        }).promise;
        const image = `page-${String(number).padStart(2, "0")}.png`;
        await writeFile(
          path.join(directory, image),
          canvas.canvas.toBuffer("image/png"),
        );
        const content = await page.getTextContent();
        const text = content.items
          .map((item) =>
            "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "",
          )
          .join("")
          .replace(/\u0000/gu, "")
          .trim()
          .slice(0, 22000);
        const textItems = content.items.filter(
          (item) =>
            "str" in item && item.str.trim() && !/^\d+$/u.test(item.str.trim()),
        ) as { str: string; height: number }[];
        const maxHeight = Math.max(0, ...textItems.map((item) => item.height));
        const title =
          textItems
            .filter((item) => item.height >= maxHeight * 0.9)
            .map((item) => item.str.trim())
            .join(" ")
            .slice(0, 100) || `Slayt ${number}`;
        pages.push({
          id: randomUUID(),
          number,
          title,
          text,
          image,
          ratio: natural.width / Math.max(natural.height, 1),
        });
      } finally {
        factory.destroy(canvas);
        page.cleanup();
      }
    }
    return pages;
  } finally {
    await loading.destroy();
  }
}

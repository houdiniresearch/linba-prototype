import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";

async function main() {
  const root = await mkdtemp("/private/tmp/linba-office-qa-");
  process.env.LINBA_DATABASE = "sqlite";
  process.env.LINBA_DATA_DIR = root;
  try {
    const { processDocument } = await import("../lib/documents");
    await Promise.all(
      ["customer", "market"].map(async (name) => {
        const bytes = await readFile(
          `tests/fixtures/presentations/${name}.pptx`,
        );
        const pages = await processDocument(
          name,
          new File([bytes], `${name}.pptx`),
        );
        assert.equal(pages.length, 8);
        assert.match(
          pages[0].title,
          name === "customer" ? /Müşteriyi.*Anlamak/ : /Pazar.*Analizi/,
        );
        assert.ok(
          pages.some((p) =>
            p.text.includes(name === "customer" ? "Görüşme" : "SOM"),
          ),
        );
        const directory = path.join(root, "files", name);
        assert.ok(
          (await readFile(path.join(directory, pages[0].image))).length > 1000,
        );
        assert.equal(
          (await readFile(path.join(directory, "presentation.pdf")))
            .subarray(0, 4)
            .toString(),
          "%PDF",
        );
        assert.ok(
          !(await readdir(directory)).some((entry) =>
            entry.startsWith("office-"),
          ),
        );
      }),
    );
    console.log(
      "PASS: two concurrent PPTX conversions, isolated Office profiles, eight original slides each, Turkish source text, PDF/PNG output and temporary-profile cleanup. No cloud or AI calls.",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

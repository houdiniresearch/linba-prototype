import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { DATA_DIR } from "./db";
import { AppError } from "./auth";
import type { Page } from "./types";
const exec = promisify(execFile);
export async function processDocument(id: string, file: File) {
  const extension = path.extname(file.name).toLowerCase();
  if (![".pdf", ".pptx"].includes(extension))
    throw new AppError("Upload a PDF or PPTX presentation.");
  if (file.size < 10 || file.size > 30 * 1024 * 1024)
    throw new AppError("The file must be no larger than 30 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (
    (extension === ".pdf" && bytes.subarray(0, 4).toString() !== "%PDF") ||
    (extension === ".pptx" && bytes.subarray(0, 2).toString() !== "PK")
  )
    throw new AppError("The file content does not match its format.");
  const directory = path.join(DATA_DIR, "files", id);
  await mkdir(directory, { recursive: true });
  const input = path.join(directory, `presentation${extension}`);
  await writeFile(input, bytes);
  const bundled = path.join(
    homedir(),
    ".cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3",
  );
  const python =
    process.env.LINBA_PYTHON || (existsSync(bundled) ? bundled : "python3");
  try {
    const { stdout } = await exec(
      python,
      [
        path.join(process.cwd(), "scripts/process_document.py"),
        input,
        directory,
      ],
      { timeout: 180000, maxBuffer: 10 * 1024 * 1024 },
    );
    return (JSON.parse(stdout) as Omit<Page, "id">[]).map((p) => ({
      ...p,
      id: randomUUID(),
    }));
  } catch {
    await rm(directory, { recursive: true, force: true });
    throw new AppError(
      "The presentation could not be processed. Check that it is not password protected or export it as a PDF and try again.",
      422,
    );
  }
}
export async function demoPages(id: string): Promise<Page[]> {
  const directory = path.join(DATA_DIR, "files", id);
  await mkdir(directory, { recursive: true });
  const content = [
    [
      "Dijital Pazarlama Temelleri",
      "Doğru kişiye, doğru mesajla ulaşmak.",
      "Hedef kitle, kanal seçimi ve ölçülebilir denemeler.",
    ],
    [
      "Hedef kitleni tanı",
      "Ürününün hangi problemi çözdüğünü belirle.",
      "Hedef kitle ortak ihtiyaç ve davranışları bulunan müşteri kesimidir. Persona bu kesimin araştırmaya dayalı temsilidir. İhtiyaç, davranış ve satın alma motivasyonlarını incele.",
    ],
    [
      "Her kanalda olmak zorunda değilsin",
      "Hedef kitlenin bulunduğu yere odaklan.",
      "Kanal seçimi hedef kitlenin davranışları, iletişim amacı ve kaynaklara göre yapılır. Küçük bir denemeyle başla; erişim, etkileşim ve dönüşümü ayrı ayrı ölç.",
    ],
    [
      "Küçük dene, öğrenerek büyüt",
      "Ölçümün, bir sonraki kararını beslesin.",
      "Başlangıç bütçesi test amacıyla sınırlandırılır. Aynı hedef üzerinden kanalları karşılaştır; daha iyi sonuç veren denemelere kademeli kaynak ayır. Beğeni ile satın alma dönüşümü aynı gösterge değildir.",
    ],
  ];
  const wrap = (text: string, length: number) => {
    const words = text.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      if ((line + " " + word).length > length) {
        lines.push(line);
        line = word;
      } else line += (line ? " " : "") + word;
    }
    if (line) lines.push(line);
    return lines;
  };
  return Promise.all(
    content.map(async ([title, subtitle, body], i) => {
      const image = `demo-${i + 1}.svg`;
      const escape = (s: string) =>
        s.replace(
          /[&<>"']/g,
          (c) =>
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&apos;",
            })[c]!,
        );
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><rect width="1280" height="720" fill="#fff"/><rect x="860" width="420" height="720" fill="#f3ebff"/><circle cx="1050" cy="310" r="125" fill="#e4d1ff"/><circle cx="1050" cy="310" r="84" fill="#ccb0f9"/><circle cx="1050" cy="310" r="42" fill="#7425bc"/><text x="64" y="66" font-family="Arial,sans-serif" font-size="23" font-weight="700" fill="#7425bc">linba · Örnek sunum</text>${wrap(
        title,
        25,
      )
        .map(
          (line, n) =>
            `<text x="64" y="${175 + n * 60}" font-family="Arial,sans-serif" font-size="48" font-weight="700" fill="#252236">${escape(line)}</text>`,
        )
        .join(
          "",
        )}<text x="64" y="340" font-family="Arial,sans-serif" font-size="25" fill="#4e495c">${escape(subtitle)}</text>${wrap(
        body,
        60,
      )
        .map(
          (line, n) =>
            `<text x="64" y="${407 + n * 34}" font-family="Arial,sans-serif" font-size="21" fill="#615c6b">${escape(line)}</text>`,
        )
        .join(
          "",
        )}<text x="64" y="660" font-family="Arial,sans-serif" font-size="17" fill="#777">Dijital Pazarlama Temelleri</text><text x="1170" y="660" font-family="Arial,sans-serif" font-size="20" fill="#7425bc">0${i + 1}</text></svg>`;
      await writeFile(path.join(directory, image), svg);
      return {
        id: randomUUID(),
        number: i + 1,
        title,
        text: [title, subtitle, body].join("\n"),
        image,
        ratio: 16 / 9,
      };
    }),
  );
}

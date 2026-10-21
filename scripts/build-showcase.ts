import { createRequire } from "node:module";
import { homedir } from "node:os";
import path from "node:path";
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import {
  showcaseDefinitions,
  type ShowcaseDefinition,
  type ShowcaseSlide,
} from "../lib/showcase-content";

const root = process.cwd();
const dependencies =
  process.env.LINBA_WORKSPACE_NODE_MODULES ||
  path.join(
    homedir(),
    ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules",
  );
const requirePackage = createRequire(path.join(dependencies, "package.json"));
const PptxGenJS = requirePackage("pptxgenjs");
const sharp = requirePackage("sharp");
const output = path.join(root, "output/showcase");
const sources = path.join(root, "public/showcase");
const python =
  process.env.LINBA_PYTHON ||
  path.join(
    homedir(),
    ".cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3",
  );

async function main() {
  await mkdir(output, { recursive: true });
  for (const [name, file] of [
    ["light", "linba-logo-color.svg"],
    ["dark", "linba-logo-dark.svg"],
  ])
    await sharp(await readFile(path.join(root, "public/brand", file)))
      .resize(560, 171)
      .png()
      .toFile(path.join(output, `logo-${name}.png`));
  for (const deck of showcaseDefinitions) {
    const directory = path.join(output, deck.key);
    await mkdir(directory, { recursive: true });
    const palettes =
      deck.theme === "dark"
        ? {
            bg: "111214",
            ink: "F5F5F7",
            muted: "B2B4BE",
            accent: "BBA2EF",
            line: "34363E",
            tint: "202126",
          }
        : {
            bg: "FFFFFF",
            ink: "252330",
            muted: "626270",
            accent: "A40957",
            line: "E0DFE6",
            tint: "F6F3FA",
          };
    const p = palettes;
    function newDeck(withActivities: boolean) {
      const pptx = new PptxGenJS();
      pptx.layout = "LAYOUT_WIDE";
      pptx.author = "LİNBA";
      pptx.subject = "Örnek atölye ve kurgusal gösterim verileri";
      pptx.title = deck.name;
      pptx.company = "LİNBA";
      pptx.lang = "tr-TR";
      pptx.theme = {
        headFontFace: "Arial",
        bodyFontFace: "Arial",
        lang: "tr-TR",
      };
      const text = (
        s: any,
        value: string,
        x: number,
        y: number,
        w: number,
        h: number,
        size = 20,
        color = p.ink,
        bold = false,
      ) =>
        s.addText(value, {
          x,
          y,
          w,
          h,
          fontFace: "Arial",
          fontSize: size,
          color,
          bold,
          margin: 0,
          breakLine: false,
          valign: "top",
          paraSpaceAfterPt: 8,
        });
      let sequence = 0;
      function base() {
        const s = pptx.addSlide();
        s.background = { color: p.bg };
        sequence++;
        s.addImage({
          path: path.join(output, `logo-${deck.theme}.png`),
          x: 0.65,
          y: 6.99,
          w: 0.9,
          h: 0.275,
        });
        text(
          s,
          String(sequence).padStart(2, "0"),
          12.1,
          7.01,
          0.55,
          0.22,
          10,
          p.muted,
        );
        return s;
      }
      function heading(s: any, title: string, subtitle?: string) {
        text(s, title, 0.7, 0.58, 11.9, 0.8, 33, p.ink, true);
        if (subtitle) text(s, subtitle, 0.7, 1.53, 11.55, 0.8, 18, p.muted);
      }
      function table(s: any, slide: ShowcaseSlide) {
        const count = slide.headers!.length;
        const widths = count === 2 ? [5.6, 6.25] : [3.6, 4.05, 4.2];
        const rows = [
          slide.headers!.map((value) => ({
            text: value,
            options: { bold: true, color: p.accent, fill: p.bg },
          })),
          ...slide.rows!.map((row) =>
            row.map((value) => ({ text: value, options: { fill: p.bg } })),
          ),
        ];
        s.addTable(rows, {
          x: 0.7,
          y: 2.6,
          w: 11.85,
          colW: widths,
          rowH: [0.52, 0.95, 0.95, 0.95],
          border: [
            { type: "solid", color: p.line, pt: 0.6 },
            { color: p.bg, pt: 0 },
            { type: "solid", color: p.line, pt: 0.6 },
            { color: p.bg, pt: 0 },
          ],
          color: p.ink,
          fill: p.bg,
          fontFace: "Arial",
          fontSize: 18,
          margin: [0.16, 0.12, 0.14, 0],
          valign: "mid",
          autoPage: false,
          bold: false,
        });
      }
      function document(slide: ShowcaseSlide, index: number) {
        const s = base();
        if (slide.layout === "cover") {
          const cover = path.join(
            sources,
            deck.key === "customer"
              ? "customer-research-cover.png"
              : "market-analysis-cover.png",
          );
          s.addImage({
            path: cover,
            x: 7.62,
            y: 0,
            w: 5.72,
            h: 7.5,
            sizing: { type: "cover", w: 5.72, h: 7.5 },
          });
          text(
            s,
            deck.theme === "light"
              ? "Müşteri araştırması atölyesi"
              : "Girişimcilik atölyesi",
            0.72,
            0.78,
            6.2,
            0.4,
            17,
            p.accent,
          );
          text(s, slide.title, 0.65, 2.0, 6.9, 2.45, 58, p.ink, true);
          text(s, slide.subtitle!, 0.72, 4.92, 5.8, 0.95, 23, p.muted);
          text(s, "LİNBA · Örnek sunum", 0.72, 6.35, 5, 0.3, 13, p.muted);
        } else if (slide.layout === "table") {
          heading(s, slide.title, slide.subtitle);
          table(s, slide);
        } else if (slide.layout === "statement") {
          heading(s, slide.title);
          text(s, slide.quote!, 0.86, 2.32, 11.45, 2.25, 33, p.ink, true);
          text(s, slide.subtitle!, 0.86, 5.12, 11.2, 0.8, 19, p.accent);
        } else if (slide.layout === "chart") {
          heading(s, slide.title, slide.subtitle);
          s.addChart(
            pptx.ChartType.bar,
            [
              {
                name:
                  deck.key === "customer" ? "Görüşme sayısı" : "Şirket sayısı",
                labels: slide.labels,
                values: slide.values,
              },
            ],
            {
              x: 0.75,
              y: 2.65,
              w: 11.8,
              h: 3.25,
              barDir: "bar",
              gapSize: 65,
              catAxisLabelFontSize: 17,
              catAxisLabelColor: p.ink,
              catAxisLabelFontFace: "Arial",
              valAxisLabelFontSize: 12,
              valAxisLabelColor: p.muted,
              valAxisMinVal: 0,
              valAxisMaxVal: deck.key === "customer" ? 10 : 2800,
              chartColors: [p.accent],
              showValue: true,
              showLegend: false,
              showTitle: false,
              showBorder: false,
              showShadow: false,
              dataLabelColor: p.ink,
              dataLabelPosition: "outEnd",
              dataLabelFormatCode: "#,##0",
              catAxisLineShow: false,
              valAxisLineShow: false,
              valGridLine: { color: p.line, size: 0.5, style: "solid" },
              chartArea: {
                fill: { color: p.bg },
                border: { color: p.bg, pt: 0 },
              },
              plotArea: {
                fill: { color: p.bg },
                border: { color: p.bg, pt: 0 },
              },
            },
          );
        } else {
          heading(s, slide.title);
          text(s, slide.quote!, 0.75, 2.25, 11.9, 2.15, 36, p.accent, true);
          text(s, slide.subtitle!, 0.75, 4.8, 10.7, 1.05, 23, p.ink);
        }
        if (slide.note)
          text(s, slide.note, 0.72, 6.36, 11.7, 0.55, 11, p.muted);
        s.addNotes(
          `${slide.speaker}\n\nKaynaklar: ${deck.sources.join("\n")}\nSayısal vaka verileri ve katılımcı alıntıları bu örnek atölye için kurgulanmıştır. Kapak görseli LİNBA için yapay zekâ ile üretilmiştir.`,
        );
      }
      function activityBlock(item: ShowcaseDefinition["activities"][number]) {
        const s = base();
        text(
          s,
          item.activity.type === "poll"
            ? "Birlikte düşünelim · Anket"
            : item.activity.type === "open"
              ? "Söz sende · Açık uçlu soru"
              : "Senaryo çalışması",
          0.75,
          0.7,
          11.5,
          0.4,
          17,
          p.accent,
        );
        text(
          s,
          item.activity.question,
          0.75,
          1.68,
          11.85,
          2.0,
          33,
          p.ink,
          true,
        );
        if (item.activity.type === "poll")
          item.activity.options.forEach((option, i) =>
            text(
              s,
              `${String.fromCharCode(65 + i)}   ${option}`,
              0.85,
              4.0 + i * 0.53,
              11.1,
              0.42,
              19,
              p.ink,
            ),
          );
        else
          text(
            s,
            "Yanıtını LİNBA’daki Aktiviteler bölümünde paylaş.\nBir örnek vererek düşünceni açıkla.",
            0.85,
            4.5,
            10.8,
            1.0,
            23,
            p.muted,
          );
        s.addNotes(
          "Katılımcıların LİNBA'da bu aktiviteye yanıt vermesini bekle. Gelen yanıtları canlı sonuç alanından takip et; iki farklı yanıtı karşılaştırarak tartışmayı aç.",
        );
      }
      deck.slides.forEach((slide, index) => {
        document(slide, index);
        if (withActivities)
          deck.activities
            .filter((activity) => activity.afterPage === index + 1)
            .forEach(activityBlock);
      });
      return pptx;
    }
    const materials = path.join(directory, `${deck.key}-materials.pptx`);
    await newDeck(false).writeFile({ fileName: materials });
    await newDeck(true).writeFile({
      fileName: path.join(
        output,
        deck.key === "customer"
          ? "musteriyi-anlamak.pptx"
          : "pazar-analizi.pptx",
      ),
    });
    execFileSync(
      "soffice",
      [
        `-env:UserInstallation=${new URL(`file://${directory}/office-profile`).href}`,
        "--headless",
        "--convert-to",
        "pdf",
        "--outdir",
        directory,
        materials,
      ],
      { timeout: 90000, maxBuffer: 2_000_000 },
    );
    const pdf = path.join(directory, `${deck.key}-materials.pdf`);
    const pages = JSON.parse(
      execFileSync(
        python,
        [path.join(root, "scripts/process_document.py"), pdf, directory],
        { timeout: 120000, maxBuffer: 4_000_000 },
      ).toString(),
    );
    execFileSync(
      "pdftoppm",
      ["-scale-to", "2400", "-png", pdf, path.join(directory, "page")],
      { timeout: 120000, maxBuffer: 2_000_000 },
    );
    const metadata = pages.map((page: any, index: number) => ({
      ...page,
      title: deck.slides[index].title.replace(/\n/g, " "),
      text: [
        deck.slides[index].title,
        deck.slides[index].subtitle,
        deck.slides[index].quote,
        deck.slides[index].headers?.join(" | "),
        ...(deck.slides[index].rows || []).map((r) => r.join(" | ")),
        deck.slides[index].labels
          ?.map((label, n) => `${label}: ${deck.slides[index].values![n]}`)
          .join("\n"),
        deck.slides[index].note,
      ]
        .filter(Boolean)
        .join("\n"),
    }));
    if (metadata.length !== deck.slides.length)
      throw new Error(`Unexpected page count for ${deck.key}`);
    await writeFile(
      path.join(directory, "pages.json"),
      JSON.stringify(metadata, null, 2),
    );
    const bundled = path.join(root, "public/showcase/materials", deck.key);
    await mkdir(bundled, { recursive: true });
    for (const file of [
      "pages.json",
      `${deck.key}-materials.pdf`,
      ...metadata.map((page: { image: string }) => page.image),
    ])
      await copyFile(path.join(directory, file), path.join(bundled, file));
    console.log(
      `${deck.name}: ${pages.length} content pages, 3 activities, editable deck ready.`,
    );
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

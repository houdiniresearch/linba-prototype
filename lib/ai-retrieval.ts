import type { Page, Question } from "./types";

const STOP = new Set([
  "nasıl",
  "nasil",
  "nedir",
  "için",
  "icin",
  "olan",
  "bunu",
  "bana",
  "bir",
  "çok",
  "cok",
  "ile",
  "neden",
  "mi",
  "mı",
  "ne",
  "ve",
  "bu",
  "şu",
  "da",
  "de",
  "the",
  "is",
  "what",
  "how",
  "and",
]);
function terms(text: string) {
  return text
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKC")
    .replace(
      /[ıöüçğş]/gu,
      (char) => ({ ı: "i", ö: "o", ü: "u", ç: "c", ğ: "g", ş: "s" })[char]!,
    )
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length >= 2 && !STOP.has(word))
    .map((word) =>
      word.replace(
        /(larının|lerinin|ların|lerin|lardan|lerden|ları|leri|lar|ler|dan|den|nda|nde)$/u,
        "",
      ),
    );
}
export type SourceChunk = {
  page: number;
  title: string;
  content: string;
  score: number;
};
function chunks(page: Page) {
  const text = page.text.trim();
  const result: string[] = [];
  for (let offset = 0; offset < text.length; offset += 1400) {
    result.push(text.slice(offset, offset + 1800));
    if (offset + 1800 >= text.length) break;
  }
  return result;
}
function overlap(term: string, word: string) {
  return (
    term === word ||
    (Math.min(term.length, word.length) >= 4 &&
      (word.startsWith(term) || term.startsWith(word)))
  );
}

/** Length-normalized lexical retrieval, rare-term weighting and original page numbers. */
export function retrieveChunks(
  pages: Page[],
  query: string,
  limit = 7,
): SourceChunk[] {
  const queryTerms = [...new Set(terms(query))];
  if (!queryTerms.length) return [];
  const corpus = pages.flatMap((page) =>
    chunks(page).map((content) => ({
      page,
      content,
      tokens: terms(content),
      title: terms(page.title),
    })),
  );
  const average =
    corpus.reduce((sum, item) => sum + item.tokens.length, 0) /
    (corpus.length || 1);
  const frequencies = queryTerms.map(
    (term) =>
      corpus.filter((item) =>
        [...item.tokens, ...item.title].some((word) => overlap(term, word)),
      ).length,
  );
  return corpus
    .map((item) => {
      const score = queryTerms.reduce((sum, term, index) => {
        const count = item.tokens.filter((word) => overlap(term, word)).length;
        const title = item.title.some((word) => overlap(term, word));
        if (!count && !title) return sum;
        const idf = Math.log(
          1 +
            (corpus.length - frequencies[index] + 0.5) /
              (frequencies[index] + 0.5),
        );
        return (
          sum +
          idf *
            ((count * 2.2) /
              (count +
                1.2 * (0.25 + (0.75 * item.tokens.length) / (average || 1))) +
              (title ? 1.5 : 0))
        );
      }, 0);
      return {
        page: item.page.number,
        title: item.page.title,
        content: item.content,
        score,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.page - b.page)
    .slice(0, limit);
}

/** Only referential follow-ups may inherit a learner's own last cited context. */
export function questionSources(
  pages: Page[],
  question: string,
  history: Question[],
) {
  const direct = retrieveChunks(pages, question);
  const referential =
    /(?:^|[^\p{L}])(bunu|bunun|bundan|buna|böyle|bununla|aynısını|peki|örneklendir|örnekle|bir örnek|daha açık|this|that|elaborate)(?=$|[^\p{L}])/iu.test(
      question,
    );
  if (!referential) return direct;
  const previous = history.at(-1);
  if (!previous) return direct;
  const inherited = retrieveChunks(pages, `${previous.text} ${question}`);
  const cited = pages.filter((page) => previous.sources.includes(page.number));
  const fallback = cited.flatMap((page) =>
    chunks(page)
      .slice(0, 2)
      .map((content) => ({
        page: page.number,
        title: page.title,
        content,
        score: 0,
      })),
  );
  const combined = [...direct, ...inherited, ...fallback];
  return combined
    .filter(
      (item, index) =>
        combined.findIndex(
          (other) => other.page === item.page && other.content === item.content,
        ) === index,
    )
    .slice(0, 7);
}
export function normalizeEvidence(text: string) {
  return text
    .normalize("NFKC")
    .toLocaleLowerCase("tr-TR")
    .replace(/[’‘]/g, "'")
    .replace(/\s+/gu, " ")
    .trim();
}

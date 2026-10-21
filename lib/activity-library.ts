import type { Activity } from "./types";

export const ACTIVITY_LIBRARY: {
  type: Activity["type"];
  title: string;
  description: string;
  response: string;
  sample: string;
  keywords: string;
}[] = [
  {
    type: "poll",
    title: "Multiple choice",
    description: "Collect answers from a set of options.",
    response: "Single-choice response",
    sample: "Which topic should we explore in more detail?",
    keywords: "poll vote choice anket çoktan seçmeli",
  },
  {
    type: "true-false",
    title: "True or false",
    description:
      "Ask participants to decide whether a statement is true or false.",
    response: "Two fixed options",
    sample:
      "A customer’s positive feedback always means they will buy the product.",
    keywords: "true false correct incorrect doğru yanlış dogru yanlis",
  },
  {
    type: "open",
    title: "Open question",
    description: "Let participants answer in their own words.",
    response: "Written response",
    sample: "What is one idea you will put into practice?",
    keywords: "open ended text written question",
  },
];

export const UPCOMING_ACTIVITIES = [
  {
    id: "scenario",
    title: "Scenario",
    keywords: "scenario situation case senaryo",
  },
  { id: "roleplay", title: "Roleplay", keywords: "roleplay role play rol" },
  {
    id: "devils-advocate",
    title: "Devil’s advocate",
    keywords: "devil advocate karşıt görüş karsit gorus",
  },
] as const;

export function searchActivityLibrary(
  query: string,
  localize: (value: string) => string,
) {
  const normalize = (value: string) =>
    value
      .toLocaleLowerCase("tr-TR")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ı/g, "i");
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  return ACTIVITY_LIBRARY.filter((item) => {
    const text = normalize(
      `${localize(item.title)} ${localize(item.description)} ${localize(item.response)} ${item.keywords} ${localize(item.keywords)}`,
    );
    return terms.every((term) => text.includes(term));
  });
}

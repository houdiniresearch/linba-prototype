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
    title: "Poll",
    description: "Collect answers from a set of options.",
    response: "Single-choice response",
    sample: "Which topic should we explore in more detail?",
    keywords: "poll vote choice",
  },
  {
    type: "open",
    title: "Open question",
    description: "Let participants answer in their own words.",
    response: "Written response",
    sample: "What is one idea you will put into practice?",
    keywords: "open ended text written question",
  },
  {
    type: "scenario",
    title: "Scenario",
    description: "Practice with a real-world situation.",
    response: "Written response",
    sample:
      "A colleague interprets the same finding differently. How would you explain your reasoning?",
    keywords: "scenario situation case application",
  },
];

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

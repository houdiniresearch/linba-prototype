import type { Activity } from "./types";

export function isChoiceActivity(type: Activity["type"] | undefined) {
  return type === "poll" || type === "true-false";
}
export function activityTypeLabel(type: Activity["type"] | undefined) {
  return type === "poll"
    ? "Multiple choice"
    : type === "true-false"
      ? "True or false"
      : type === "scenario"
        ? "Scenario"
        : "Open question";
}

/** Compare the content that Save persists, including its AI provenance. */
export function activityDraftChanged(
  initial: Activity | undefined,
  draft: Activity,
) {
  // Choosing a format or adding empty fields does not create content to lose.
  if (
    !initial &&
    !draft.question.trim() &&
    (draft.type === "true-false" ||
      !draft.options.some((option) => option.trim()))
  )
    return false;
  const snapshot = (activity: Activity) =>
    JSON.stringify({
      type: activity.type,
      question: activity.question.trim(),
      options: isChoiceActivity(activity.type)
        ? activity.options.map((option) => option.trim()).filter(Boolean)
        : [],
      aiGenerated: !!activity.aiGenerated,
    });
  return (
    snapshot(initial || { type: "poll", question: "", options: [] }) !==
    snapshot(draft)
  );
}

export function hasDuplicateOptions(options: string[]) {
  const labels = options.map((option) =>
    option.trim().toLocaleLowerCase("tr-TR"),
  );
  return new Set(labels).size !== labels.length;
}

export function pollResults(options: string[], responses: { value: string }[]) {
  return [...new Set(options)].map((option) => {
    const count = responses.filter(
      (response) => response.value === option,
    ).length;
    return {
      option,
      count,
      percentage: responses.length ? (count / responses.length) * 100 : 0,
    };
  });
}

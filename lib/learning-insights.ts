import type { Question } from "./types";

/** Questions with cited answers are evidence; escalations need instructor review. */
export function learningSignals(questions: Question[]) {
  const grounded = questions.filter(
    (question) =>
      question.status === "answered" &&
      !!question.answer &&
      question.sources.length > 0,
  );
  const topics = new Map<
    string,
    { id: string; title: string; count: number }
  >();
  for (const question of grounded) {
    const id = question.groupId || question.id;
    const topic = topics.get(id) || {
      id,
      title: question.groupTitle || question.text,
      count: 0,
    };
    topic.count++;
    topics.set(id, topic);
  }
  return {
    grounded,
    topics: [...topics.values()].sort((a, b) => b.count - a.count),
    needsReview: questions.filter(
      (question) => question.status !== "answered" && !question.addressed,
    ),
  };
}

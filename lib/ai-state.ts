import type { Question } from "./types";

/** Recovery after a process restart; normal answer + verification fits below this window. */
export function recoverPendingQuestion(
  question: Question,
  now = Date.now(),
): Question {
  const created = Date.parse(question.createdAt);
  if (
    question.status !== "pending" ||
    (Number.isFinite(created) && now - created < 120_000)
  )
    return question;
  if (question.conversationOnly)
    return {
      ...question,
      status: "answered",
      answer: "Şu anda yanıt hazırlayamadım. Biraz sonra tekrar dener misin?",
      sources: [],
      reason: undefined,
      groupId: "",
      groupTitle: "",
    };
  return {
    ...question,
    status: "escalated",
    answer: undefined,
    sources: [],
    reason:
      "An AI answer is unavailable. Your question was forwarded to the instructor.",
  };
}

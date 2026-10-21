import {
  practiceFeedbackContract,
  type PracticeFeedbackOutput,
} from "./ai-contracts";

export const PRACTICE_GREETING =
  "Merhabalar, seni dinliyoruz. Hazır olduğunda başlayabilirsin.";
export const PRACTICE_QUESTION_WORD_LIMIT = 18;
export const PRACTICE_TURN_WORD_LIMIT = 24;
export function practiceTurnIsConcise(text: string) {
  const words = text.trim().split(/\s+/u).filter(Boolean).length;
  const questions = (text.match(/\?/gu) || []).length;
  return (
    text.length <= 320 &&
    questions <= 1 &&
    words <=
      (questions ? PRACTICE_QUESTION_WORD_LIMIT : PRACTICE_TURN_WORD_LIMIT)
  );
}
export function shouldGreetPractice(
  session: { id: string; voiceExpiresAt?: string },
  greeted: ReadonlySet<string>,
) {
  return !session.voiceExpiresAt && !greeted.has(session.id);
}

const normalized = (value: string) =>
  value
    .normalize("NFKC")
    .toLocaleLowerCase("tr-TR")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
/** Never display an invented question or one whose audio was interrupted/not played. */
export function parsePracticeFeedback(
  value: unknown,
  completedRemarks: string[],
): PracticeFeedbackOutput {
  const feedback = practiceFeedbackContract.parse(value);
  return {
    summary: feedback.summary.trim(),
    suggestions: [...new Set(feedback.suggestions.map((item) => item.trim()))],
    questions: [
      ...new Set(feedback.questions.map((item) => item.trim())),
    ].filter((question) => {
      const needle = normalized(question);
      return (
        needle.length >= 8 &&
        completedRemarks.some((remark) => normalized(remark).includes(needle))
      );
    }),
  };
}
/** Reject gross speech drift while allowing minor transcript punctuation/word-form differences. */
export function speechMatchesLine(expected: string, actual: string) {
  const a = normalized(expected).split(" "),
    b = normalized(actual).split(" ");
  if (!normalized(actual)) return false;
  if (normalized(expected) === normalized(actual)) return true;
  if (a.length <= 4 || b.length / a.length < 0.75 || b.length / a.length > 1.25)
    return false;
  let row = b.map((_, index) => index + 1);
  row.unshift(0);
  for (let i = 0; i < a.length; i++) {
    const next = [i + 1];
    for (let j = 0; j < b.length; j++)
      next.push(
        Math.min(next[j] + 1, row[j + 1] + 1, row[j] + (a[i] === b[j] ? 0 : 1)),
      );
    row = next;
  }
  return row[b.length] / Math.max(a.length, b.length) <= 0.2;
}

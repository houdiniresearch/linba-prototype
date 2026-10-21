import type { ActivityResponse, Course, Question } from "./types";

export const CONFUSION_WINDOW_MS = 5 * 60_000;
const MIN_TOPIC_QUESTIONS = 3;
const MIN_TOPIC_PARTICIPANTS = 2;

/** A recent concentration of questions, not a claim about learning accuracy. */
export function confusionSpikes(
  questions: Question[],
  course: Pick<Course, "id" | "startedAt">,
  now: number,
) {
  const start = course.startedAt ? Date.parse(course.startedAt) : NaN;
  const since = Math.max(
    now - CONFUSION_WINDOW_MS,
    Number.isFinite(start) ? start : 0,
  );
  const topics = new Map<
    string,
    {
      id: string;
      title: string;
      questions: Set<string>;
      participants: Set<string>;
      latest: number;
    }
  >();
  for (const question of questions) {
    const timestamp = Date.parse(question.createdAt);
    if (
      question.courseId !== course.id ||
      question.stage !== "live" ||
      question.status === "manual" ||
      question.addressed ||
      !question.groupId ||
      !question.userId ||
      !Number.isFinite(timestamp) ||
      timestamp <= since ||
      timestamp > now
    )
      continue;
    const topic = topics.get(question.groupId) || {
      id: question.groupId,
      title: question.groupTitle || question.text,
      questions: new Set<string>(),
      participants: new Set<string>(),
      latest: 0,
    };
    topic.questions.add(question.id);
    topic.participants.add(question.userId);
    if (timestamp >= topic.latest) {
      topic.title = question.groupTitle || question.text;
      topic.latest = timestamp;
    }
    topics.set(topic.id, topic);
  }
  return [...topics.values()]
    .filter(
      (topic) =>
        topic.questions.size >= MIN_TOPIC_QUESTIONS &&
        topic.participants.size >= MIN_TOPIC_PARTICIPANTS,
    )
    .map((topic) => ({
      id: topic.id,
      title: topic.title,
      count: topic.questions.size,
      participants: topic.participants.size,
      latest: topic.latest,
    }))
    .sort(
      (a, b) =>
        b.count - a.count || b.latest - a.latest || a.id.localeCompare(b.id),
    );
}

/** Follow the active activity, or the last activity preceding the displayed slide. */
export function currentAssessmentSlide(
  course: Pick<Course, "slides" | "activeSlideId">,
) {
  const index = course.slides.findIndex(
    (slide) => slide.id === course.activeSlideId,
  );
  return course.slides
    .slice(0, index + 1)
    .reverse()
    .find((slide) => slide.kind === "activity" && slide.activity);
}

/** Keep the latest saved submission per participant, scoped to this presentation. */
export function liveActivityResponses(
  responses: ActivityResponse[],
  courseId: string,
  slideId: string,
) {
  const latest = new Map<string, ActivityResponse>();
  for (const response of responses) {
    if (response.courseId !== courseId || response.slideId !== slideId)
      continue;
    const previous = latest.get(response.userId);
    if (
      !previous ||
      Date.parse(response.createdAt) >= Date.parse(previous.createdAt)
    )
      latest.set(response.userId, response);
  }
  return [...latest.values()].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

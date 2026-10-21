import { asyncForEach } from "./async-collections";
import { isChoiceActivity } from "./activities";
import { put, transaction } from "./db";
import { showcaseDefinitions } from "./showcase-content";
import type { ActivityResponse, Course, Question } from "./types";
const names = [
  "Deniz Kaya",
  "Selin Yılmaz",
  "Ece Aydın",
  "Arda Demir",
  "İrem Aksoy",
  "Mert Arslan",
  "Zeynep Çelik",
  "Berk Yıldız",
  "Duru Şahin",
  "Can Eren",
  "Elif Koç",
  "Emir Acar",
  "Ada Sezer",
  "Kerem Öz",
  "Aslı Tan",
  "Eren Baş",
  "İdil Ergin",
  "Ozan Tekin",
  "Nil Kılıç",
  "Sarp Güneş",
  "İpek Uçar",
  "Alp Şen",
  "Defne Toprak",
  "Onur Çetin",
];
export function isShowcase(course: Course) {
  return (
    course.showcase?.pack === "bigg-v1" &&
    showcaseDefinitions.some((item) => item.key === course.showcase?.key)
  );
}
/** Explicit sample data only. Stable, presentation-scoped IDs never replace real participant records. */
export async function seedShowcaseRecords(course: Course, now = Date.now()) {
  if (!isShowcase(course)) return;
  return transaction(async () => {
    const definition = showcaseDefinitions.find(
      (item) => item.key === course.showcase!.key,
    )!;
    const prefix = `showcase:${course.id}:`;
    const ended = course.status === "ended";
    const reference =
      ended && course.endedAt ? Date.parse(course.endedAt) - 60000 : now;
    const started = course.startedAt ? Date.parse(course.startedAt) : 0;
    const timestamp = (offset: number) =>
      new Date(Math.max(started + 1, reference - offset)).toISOString();
    const members = names
      .slice(0, definition.participants)
      .map((name, index) => ({
        id: `${course.id}:${prefix}participant:${index}`,
        courseId: course.id,
        userId: `${prefix}participant:${index}`,
        name,
      }));
    await asyncForEach(members, async (member) => await put("member", member));
    const activities = course.slides.filter(
      (slide) => slide.kind === "activity",
    );
    await asyncForEach(definition.activities, async (item, index) => {
      const slide = activities[index];
      if (!slide) return;
      const answers = isChoiceActivity(item.activity.type)
        ? item.activity.options.flatMap(
            (option, optionIndex) =>
              Array(item.distribution![optionIndex]).fill(option) as string[],
          )
        : Array.from(
            { length: definition.participants - index * 2 - 1 },
            (_, n) => item.answers[n % item.answers.length],
          );
      await asyncForEach(answers, async (value, n) => {
        const member = members[n];
        await put<ActivityResponse>("response", {
          id: `${prefix}response:${index}:${n}`,
          courseId: course.id,
          slideId: slide.id,
          userId: member.userId,
          userName: member.name,
          value,
          createdAt: timestamp((activities.length - index) * 45000 + n * 1300),
        });
      });
    });
    await asyncForEach(definition.questions, async (item, index) => {
      const member = members[(index * 3) % members.length];
      await put<Question>("question", {
        id: `${prefix}question:${index}`,
        courseId: course.id,
        userId: member.userId,
        userName: member.name,
        text: item.text,
        answer: item.answer,
        status: item.review ? "escalated" : "answered",
        reason: item.review
          ? "Bu soruyu eğitmenin bir örnek üzerinden açıklaması gerekiyor."
          : undefined,
        groupId: `${prefix}topic:${item.topic}`,
        groupTitle: item.title,
        sources: item.answer ? [item.source] : [],
        stage: "live",
        createdAt: timestamp(index * 13000),
      });
    });
    if (ended) {
      course.report = {
        summary: definition.summary,
        recommendations: definition.recommendations,
        updatedAt: course.endedAt!,
        ai: false,
        source: "showcase",
      };
      await put("course", course);
    }
  });
}

import type { Slide } from "./types";

/** Only activities may move. Moving one cannot reorder the source document pages. */
export function moveActivityInOrder(
  slides: Slide[],
  activityId: string,
  targetId: string,
) {
  const from = slides.findIndex((slide) => slide.id === activityId);
  const to = slides.findIndex((slide) => slide.id === targetId);
  if (from < 0 || to < 0 || slides[from].kind !== "activity") return null;
  const ids = slides.map((slide) => slide.id);
  ids.splice(from, 1);
  ids.splice(to, 0, activityId);
  return ids;
}

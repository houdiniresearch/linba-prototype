import type { ActivityResponse, Course, Slide } from "./types";

/** One read at a time. Cancellation prevents old reads replacing newer state. */
export function createLiveReader<T>(
  load: (signal: AbortSignal) => Promise<T>,
  timeoutMs = 8000,
) {
  let pending: Promise<T | undefined> | undefined;
  let controller: AbortController | undefined;
  let generation = 0;
  return {
    read() {
      if (pending) return pending;
      const current = ++generation;
      const request = new AbortController();
      controller = request;
      const timeout = setTimeout(
        () => request.abort(new Error("Live updates timed out.")),
        timeoutMs,
      );
      // Race against abort as well: an unresponsive transport must not lock retries.
      const aborted = new Promise<never>((_, reject) =>
        request.signal.addEventListener(
          "abort",
          () => reject(request.signal.reason),
          { once: true },
        ),
      );
      const result = Promise.race([
        Promise.resolve().then(() => load(request.signal)),
        aborted,
      ])
        .then((value) => (current === generation ? value : undefined))
        .catch((error) => {
          if (current === generation) throw error;
          return undefined;
        })
        .finally(() => {
          clearTimeout(timeout);
          if (current === generation) {
            pending = undefined;
            controller = undefined;
          }
        });
      pending = result;
      return result;
    },
    cancel() {
      generation++;
      controller?.abort();
      controller = undefined;
      pending = undefined;
    },
  };
}

export type ActivityDrafts = Record<string, string>;
export function unsentActivityDrafts(
  course: Course,
  drafts: ActivityDrafts,
  responses: ActivityResponse[],
): (Slide & { draft: string })[] {
  return course.slides.flatMap((slide) => {
    const draft = drafts[slide.id];
    return slide.activity &&
      draft?.trim() &&
      !responses.some((response) => response.slideId === slide.id) &&
      !(course.status === "live" && course.activeSlideId === slide.id)
      ? [{ ...slide, draft }]
      : [];
  });
}

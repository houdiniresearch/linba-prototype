import type { Course } from "./types";
/** These eight-page examples are already shipped as public, immutable material.
 * Uploaded presentations continue using the permission-checked private endpoint. */
export function slideSource(
  course: Pick<Course, "id" | "showcase">,
  number: number,
  options: { participant?: boolean; displayKey?: string } = {},
) {
  const example = course.showcase;
  if (
    example?.pack === "bigg-v1" &&
    ["customer", "market"].includes(example.key) &&
    Number.isInteger(number) &&
    number >= 1 &&
    number <= 8
  )
    return `/showcase/materials/${example.key}/page-${number}.png`;
  return `/api/${options.participant ? "participant/" : ""}courses/${course.id}/page/${number}${options.displayKey ? `?key=${encodeURIComponent(options.displayKey)}` : ""}`;
}

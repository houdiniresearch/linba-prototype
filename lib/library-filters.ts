export type LibraryPeriod = {
  period: "all" | "recent" | "month" | "year" | "custom";
  from: string;
  to: string;
};
export const ALL_TIME: LibraryPeriod = { period: "all", from: "", to: "" };
function calendarDay(value: number) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  return ["year", "month", "day"]
    .map((key) => parts.find((part) => part.type === key)!.value)
    .join("-");
}
export function withinLibraryPeriod(
  value: string | undefined,
  filter: LibraryPeriod,
  now = Date.now(),
) {
  if (filter.period === "all") return true;
  const timestamp = Date.parse(value || "");
  if (!Number.isFinite(timestamp)) return false;
  const day = calendarDay(timestamp),
    today = calendarDay(now);
  if (filter.period === "custom")
    return (
      (!filter.from || day >= filter.from) &&
      (!filter.to || day <= filter.to) &&
      (!filter.from || !filter.to || filter.from <= filter.to)
    );
  if (timestamp > now) return false;
  if (filter.period === "recent") return timestamp >= now - 7 * 86400000;
  return filter.period === "month"
    ? day.slice(0, 7) === today.slice(0, 7)
    : day.slice(0, 4) === today.slice(0, 4);
}

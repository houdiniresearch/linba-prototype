/** Elapsed training time; missing or invalid timestamps must not imply zero duration. */
export function formatTrainingDuration(
  startedAt: string | undefined,
  endedAt: string | undefined,
  locale: "tr" | "en",
  pausedDurationMs = 0,
) {
  if (!startedAt || !endedAt) return null;
  const elapsed = Date.parse(endedAt) - Date.parse(startedAt);
  if (!Number.isFinite(elapsed) || elapsed < 0) return null;
  const milliseconds = Math.max(
    0,
    elapsed - Math.max(0, pausedDurationMs || 0),
  );
  const minutes = Math.floor(milliseconds / 60_000);
  if (minutes < 1)
    return locale === "tr" ? "1 dakikadan az" : "Less than a minute";
  const hours = Math.floor(minutes / 60);
  const format = (value: number, unit: "hour" | "minute") =>
    new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-GB", {
      style: "unit",
      unit,
      unitDisplay: "long",
    }).format(value);
  return [hours ? format(hours, "hour") : "", format(minutes % 60, "minute")]
    .filter(Boolean)
    .join(" ");
}

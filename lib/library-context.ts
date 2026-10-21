import { ALL_TIME, type LibraryPeriod } from "./library-filters";
export type LibraryContext = {
  search: string;
  groupFilter: string;
  trainingPeriod: LibraryPeriod;
  reportPeriod: LibraryPeriod;
};
export function emptyLibraryContext(): LibraryContext {
  return {
    search: "",
    groupFilter: "all",
    trainingPeriod: { ...ALL_TIME },
    reportPeriod: { ...ALL_TIME },
  };
}
function period(value: unknown): LibraryPeriod {
  if (!value || typeof value !== "object") return { ...ALL_TIME };
  const p = value as Record<string, unknown>;
  if (!["all", "recent", "month", "year", "custom"].includes(String(p.period)))
    return { ...ALL_TIME };
  const day = (v: unknown) =>
    typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "";
  return {
    period: p.period as LibraryPeriod["period"],
    from: day(p.from),
    to: day(p.to),
  };
}
export function readLibraryContext(raw: string | null): LibraryContext {
  const defaults = emptyLibraryContext();
  try {
    const value = JSON.parse(raw || "null");
    if (!value || typeof value !== "object") return defaults;
    return {
      search:
        typeof value.search === "string" ? value.search.slice(0, 2000) : "",
      groupFilter:
        typeof value.groupFilter === "string" && value.groupFilter.length <= 100
          ? value.groupFilter
          : "all",
      trainingPeriod: period(value.trainingPeriod),
      reportPeriod: period(value.reportPeriod),
    };
  } catch {
    return defaults;
  }
}

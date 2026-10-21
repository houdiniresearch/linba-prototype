export const reportTabs = [
  "report-overview",
  "report-questions",
  "report-activities",
] as const;
export type ReportTab = (typeof reportTabs)[number];

/** Evidence links must reveal the right panel before moving to a source group. */
export function reportTabForSection(section: string): ReportTab | null {
  if (section === "report-top") return "report-overview";
  if (section.startsWith("report-topic-")) return "report-questions";
  return reportTabs.includes(section as ReportTab)
    ? (section as ReportTab)
    : null;
}

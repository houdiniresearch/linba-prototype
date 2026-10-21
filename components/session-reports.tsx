"use client";
import type { Course } from "@/lib/types";
import { learningAccess } from "@/lib/training-access";
import { useProductLocale as useLocale } from "./product-locale";
import { date, Icon } from "./ui";
import { MemberAvatar } from "./team-workspace";

export function SessionReportDate({ value }: { value: string }) {
  const { locale } = useLocale();
  return (
    <time className="report-date" dateTime={value}>
      <span>{date(value, locale)}</span>
      <span className="report-date-separator" aria-hidden="true">
        ·
      </span>
      <strong>
        {new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-GB", {
          timeZone: "Europe/Istanbul",
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        }).format(new Date(value))}
      </strong>
    </time>
  );
}
function ReportCreator({ name }: { name: string }) {
  return (
    <span className="report-author">
      <MemberAvatar name={name} />
      <span>{name}</span>
    </span>
  );
}
export function SessionReports({
  courses,
  onOpen,
}: {
  courses: Course[];
  onOpen: (id: string) => void;
}) {
  const { t } = useLocale();
  const access = (course: Course) =>
    learningAccess(course).canAsk
      ? t("{days} days remaining", {
          days: learningAccess(course).remainingDays,
        })
      : t("Access ended");
  return (
    <>
      <div className="table-wrap session-report-table">
        <table>
          <caption className="sr-only">{t("Completed reports")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("Presentation")}</th>
              <th scope="col">{t("Created by")}</th>
              <th scope="col">{t("Completion date")}</th>
              <th scope="col">{t("Learning agent access")}</th>
              <th scope="col">
                <span className="sr-only">{t("Open report")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id} onClick={() => onOpen(course.id)}>
                <td>
                  <button
                    className="table-link"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpen(course.id);
                    }}
                  >
                    {course.name}
                  </button>
                </td>
                <td>
                  <ReportCreator
                    name={course.createdBy || t("Unknown creator")}
                  />
                </td>
                <td>
                  {course.endedAt ? (
                    <SessionReportDate value={course.endedAt} />
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <span
                    className="report-access-state"
                    data-active={learningAccess(course).canAsk || undefined}
                  >
                    {access(course)}
                  </span>
                </td>
                <td>
                  <span className="report-open-indicator">
                    <Icon name="arrow" size={18} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="session-report-mobile" aria-label={t("Completed reports")}>
        {courses.map((course) => (
          <li key={course.id}>
            <button
              className="session-report-open"
              onClick={() => onOpen(course.id)}
            >
              <span className="session-report-name">
                <strong>{course.name}</strong>
                <Icon name="arrow" size={18} />
              </span>
              <span className="report-session-label">
                <span className="sr-only">{t("Created by")} </span>
                <ReportCreator
                  name={course.createdBy || t("Unknown creator")}
                />
              </span>
              <span className="session-report-mobile-dates">
                <span>
                  <span>{t("Completion date")}</span>
                  {course.endedAt ? (
                    <SessionReportDate value={course.endedAt} />
                  ) : (
                    "—"
                  )}
                </span>
              </span>
              <span className="session-report-access">
                <span>{t("Learning agent access")}</span>
                <span
                  className="report-access-state"
                  data-active={learningAccess(course).canAsk || undefined}
                >
                  {access(course)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

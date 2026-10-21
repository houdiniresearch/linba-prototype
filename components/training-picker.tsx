"use client";

import { useState, type RefObject } from "react";
import type { Course } from "@/lib/types";
import { useProductLocale as useLocale } from "./product-locale";
import { dateTime, Icon, Modal } from "./ui";

export function TrainingPicker({
  feature,
  courses,
  onPick,
  onClose,
  returnFocusRef,
}: {
  feature: "practice" | "activities";
  courses: Course[];
  onPick: (course: Course) => void;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const { t, locale } = useLocale();
  const [search, setSearch] = useState("");
  const matches = courses.filter((course) =>
    course.name
      .toLocaleLowerCase(locale)
      .includes(search.trim().toLocaleLowerCase(locale)),
  );
  return (
    <Modal
      open
      onClose={onClose}
      returnFocusRef={returnFocusRef}
      title={t(
        feature === "practice"
          ? "Which training would you like to practice?"
          : "Which training would you like to add activities to?",
      )}
      description={t("Choose a draft to continue where you left off.")}
      className="training-picker-modal"
    >
      <label className="training-picker-search">
        {t("Search presentations")}
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("Search your presentations…")}
        />
      </label>
      <ul className="training-picker-list" aria-label={t("Draft training")}>
        {matches.map((course) => (
          <li key={course.id}>
            <button onClick={() => onPick(course)}>
              <Icon
                name={feature === "practice" ? "mic" : "presentation"}
                size={20}
              />
              <span>
                <strong>{course.name}</strong>
                <small>
                  {t("Created")} · {dateTime(course.createdAt, locale)}
                </small>
              </span>
              <Icon name="arrow" size={18} />
            </button>
          </li>
        ))}
      </ul>
      {!matches.length && (
        <p className="training-picker-empty" role="status">
          {t("No training matches this search. Try another name.")}
        </p>
      )}
    </Modal>
  );
}

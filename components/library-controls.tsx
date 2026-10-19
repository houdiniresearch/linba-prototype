"use client";
import { useId, useRef, useState } from "react";
import type { Course } from "@/lib/types";
import type { TrainingGroup } from "@/lib/workspace-library";
import type { LibraryPeriod } from "@/lib/library-filters";
import { useLocale } from "./locale-provider";
import { api, ErrorNote, Icon, Modal } from "./ui";
export function DateFilter({
  value,
  onChange,
}: {
  value: LibraryPeriod;
  onChange: (next: LibraryPeriod) => void;
}) {
  const { t } = useLocale();
  return (
    <div className="library-date-filter">
      <label className="library-period-label">
        <span className="sr-only">{t("Filter by date")}</span>
        <select
          aria-label={t("Filter by date")}
          value={value.period}
          onChange={(event) =>
            onChange({
              ...value,
              period: event.target.value as LibraryPeriod["period"],
            })
          }
        >
          {[
            ["all", "All time"],
            ["recent", "Recent · last 7 days"],
            ["month", "This month"],
            ["year", "This year"],
            ["custom", "Custom range"],
          ].map(([key, text]) => (
            <option key={key} value={key}>
              {t(text)}
            </option>
          ))}
        </select>
      </label>
      {value.period === "custom" && (
        <>
          <label>
            {t("From")}
            <input
              type="date"
              value={value.from}
              max={value.to || undefined}
              onChange={(event) =>
                onChange({ ...value, from: event.target.value })
              }
            />
          </label>
          <label>
            {t("To")}
            <input
              type="date"
              value={value.to}
              min={value.from || undefined}
              onChange={(event) =>
                onChange({ ...value, to: event.target.value })
              }
            />
          </label>
        </>
      )}
    </div>
  );
}
export function GroupManager({
  open,
  onClose,
  groups,
  onChanged,
  returnFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  groups: TrainingGroup[];
  onChanged: () => Promise<unknown>;
  returnFocusRef: React.RefObject<HTMLElement | null>;
}) {
  const { t } = useLocale();
  const [name, setName] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function create() {
    setBusy(true);
    setError("");
    try {
      await api("groups", { name });
      setName("");
      await onChanged();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      open={open}
      onClose={() => !busy && onClose()}
      closeDisabled={busy}
      title={t("Training groups")}
      returnFocusRef={returnFocusRef}
    >
      <p className="muted">
        {t(
          "Organize training by topic, team or any system that works for you.",
        )}
      </p>
      <form
        className="group-create-form"
        onSubmit={(event) => {
          event.preventDefault();
          void create();
        }}
      >
        <label>
          {t("New group")}
          <input
            maxLength={60}
            placeholder={t("For example: Sales training")}
            value={name}
            required
            disabled={busy}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <button className="button" disabled={busy || !name.trim()}>
          {t("Add group")}
        </button>
      </form>
      <ErrorNote message={error} />
      <div className="group-manager-list">
        {groups.map((group) => (
          <GroupRow key={group.id} group={group} onChanged={onChanged} />
        ))}
      </div>
      <p className="small muted">
        {t("Deleting a group keeps its training in your library.")}
      </p>
    </Modal>
  );
}
function GroupRow({
  group,
  onChanged,
}: {
  group: TrainingGroup;
  onChanged: () => Promise<unknown>;
}) {
  const { t } = useLocale();
  const [name, setName] = useState(group.name),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function save(remove = false) {
    setBusy(true);
    setError("");
    try {
      await api(
        `groups/${group.id}`,
        remove ? undefined : { name },
        remove ? "DELETE" : "PATCH",
      );
      await onChanged();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <input
        aria-label={t("Group name")}
        value={name}
        maxLength={60}
        required
        disabled={busy}
        onChange={(event) => setName(event.target.value)}
      />
      <button
        className="icon-button"
        aria-label={t("Save group")}
        disabled={busy || name === group.name || !name.trim()}
      >
        <Icon name="check" size={18} />
      </button>
      <button
        className="icon-button"
        type="button"
        aria-label={t("Delete group")}
        disabled={busy}
        onClick={() => void save(true)}
      >
        <Icon name="trash" size={18} />
      </button>
      <ErrorNote message={error} />
    </form>
  );
}
export function TrainingCardMenu({
  course,
  groups,
  onChanged,
}: {
  course: Course;
  groups: TrainingGroup[];
  onChanged: () => Promise<unknown>;
}) {
  const { t } = useLocale();
  const id = useId(),
    menu = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function update(action: "group" | "trash", groupId?: string) {
    setBusy(true);
    setError("");
    try {
      await api(
        `courses/${course.id}/${action}`,
        action === "group" ? { groupId } : {},
      );
      menu.current?.hidePopover();
      await onChanged();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        type="button"
        className="icon-button training-card-menu-trigger"
        aria-label={t("Training options for {name}", { name: course.name })}
        popoverTarget={id}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setPosition({
            top: Math.min(rect.bottom + 6, window.innerHeight - 240),
            left: Math.max(
              12,
              Math.min(rect.right - 240, window.innerWidth - 252),
            ),
          });
        }}
      >
        <Icon name="more" size={20} />
      </button>
      <div
        ref={menu}
        id={id}
        popover="auto"
        className="training-card-menu"
        style={position}
      >
        <label>
          {t("Move to group")}
          <select
            value={course.groupId || ""}
            disabled={busy}
            onChange={(event) => void update("group", event.target.value)}
          >
            <option value="">{t("Ungrouped")}</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="popover-item"
          disabled={busy || course.status === "live"}
          onClick={() => void update("trash")}
        >
          <Icon name="trash" size={18} />
          {t("Move to Trash")}
        </button>
        <ErrorNote message={error} />
      </div>
    </>
  );
}

"use client";
import { useEffect, useId, useRef, useState, type RefObject } from "react";
import type { Course } from "@/lib/types";
import type { TrainingGroup } from "@/lib/workspace-library";
import { ALL_TIME, type LibraryPeriod } from "@/lib/library-filters";
import { useLocale } from "./locale-provider";
import { api, ErrorNote, Icon, Modal } from "./ui";

function placePopover(trigger: HTMLElement, width: number, height: number) {
  const rect = trigger.getBoundingClientRect();
  return {
    top: Math.max(
      8,
      Math.min(rect.bottom + 8, window.innerHeight - height - 12),
    ),
    left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
  };
}

const periods = [
  ["all", "All time"],
  ["recent", "Recent · last 7 days"],
  ["month", "This month"],
  ["year", "This year"],
] as const;

export function DateFilter({
  value,
  onChange,
}: {
  value: LibraryPeriod;
  onChange: (next: LibraryPeriod) => void;
}) {
  const { t, locale } = useLocale();
  const id = useId(),
    panel = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [custom, setCustom] = useState(false),
    [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const invalid = !!from && !!to && from > to;
  const format = (day: string) =>
    new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }).format(new Date(`${day}T12:00:00Z`));
  const label =
    value.period === "custom"
      ? value.from && value.to
        ? value.from === value.to
          ? format(value.from)
          : `${format(value.from)} – ${format(value.to)}`
        : t("Custom range")
      : t(periods.find(([key]) => key === value.period)?.[1] || "All time");
  function close() {
    panel.current?.hidePopover();
  }
  return (
    <div className="library-date-filter">
      <button
        type="button"
        className="library-filter-trigger"
        popoverTarget={id}
        aria-haspopup="dialog"
        aria-label={`${t("Filter by date")}: ${label}`}
        data-active={value.period !== "all" || undefined}
        onClick={(event) => {
          setPosition(placePopover(event.currentTarget, 300, 450));
          setCustom(value.period === "custom");
          setFrom(value.from);
          setTo(value.to);
        }}
      >
        <Icon name="calendar" size={18} />
        <span>{label}</span>
        <Icon name="downCaret" size={13} />
      </button>
      <div
        id={id}
        ref={panel}
        popover="auto"
        role="dialog"
        aria-label={t("Filter by date")}
        className="library-filter-popover"
        style={{
          ...position,
          maxHeight: `calc(100dvh - ${position.top + 12}px)`,
        }}
      >
        <div className="filter-popover-heading">
          <strong>{t("Filter by date")}</strong>
          <button
            type="button"
            className="icon-button"
            aria-label={t("Close")}
            onClick={close}
          >
            <Icon name="close" size={17} />
          </button>
        </div>
        <div className="date-presets">
          {periods.map(([key, text]) => (
            <button
              key={key}
              type="button"
              aria-pressed={value.period === key}
              onClick={() => {
                onChange({ ...ALL_TIME, period: key });
                close();
              }}
            >
              <span>{t(text)}</span>
              {value.period === key && <Icon name="check" size={17} />}
            </button>
          ))}
          <button
            type="button"
            aria-expanded={custom}
            onClick={() => setCustom(!custom)}
          >
            <span>{t("Custom range")}</span>
            <Icon name={custom ? "downCaret" : "right"} size={15} />
          </button>
        </div>
        {custom && (
          <form
            className="date-custom-range"
            onSubmit={(event) => {
              event.preventDefault();
              if (!invalid && from && to) {
                onChange({ period: "custom", from, to });
                close();
              }
            }}
          >
            <div>
              <label>
                {t("From")}
                <input
                  type="date"
                  required
                  value={from}
                  max={to || undefined}
                  onChange={(event) => setFrom(event.target.value)}
                />
              </label>
              <label>
                {t("To")}
                <input
                  type="date"
                  required
                  value={to}
                  min={from || undefined}
                  onChange={(event) => setTo(event.target.value)}
                />
              </label>
            </div>
            {invalid && (
              <ErrorNote message="The end date must be on or after the start date." />
            )}
            <button
              className="button primary"
              disabled={!from || !to || invalid}
            >
              {t("Apply range")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function TrainingGroups({
  groups,
  counts,
  loading,
  value,
  onChange,
  onManage,
  activeRef,
}: {
  groups: TrainingGroup[];
  counts: Record<string, number>;
  loading?: boolean;
  value: string;
  onChange: (id: string) => void;
  onManage: (trigger: HTMLElement) => void;
  activeRef?: RefObject<HTMLButtonElement | null>;
}) {
  const { t } = useLocale();
  const items = [
    { id: "all", name: t("All training") },
    ...(groups.length
      ? [{ id: "ungrouped", name: t("Ungrouped") }, ...groups]
      : []),
  ];
  return (
    <div className="library-group-bar">
      <nav className="library-group-tabs" aria-label={t("Training groups")}>
        {items.map((group) => (
          <button
            type="button"
            key={group.id}
            ref={value === group.id ? activeRef : undefined}
            aria-current={value === group.id ? "true" : undefined}
            onClick={() => onChange(group.id)}
          >
            {group.id !== "all" && group.id !== "ungrouped" && (
              <Icon name="folder" size={16} />
            )}
            <span>{group.name}</span>
            <small>{loading ? "—" : counts[group.id] || 0}</small>
          </button>
        ))}
      </nav>
      <button
        type="button"
        className="library-organize-button"
        onClick={(event) => onManage(event.currentTarget)}
        title={t("Manage groups")}
      >
        <Icon name="folderPlus" size={18} />
        <span>{t(groups.length ? "Manage groups" : "Create a group")}</span>
      </button>
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
  returnFocusRef: RefObject<HTMLElement | null>;
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
      description={t("Organize your library by topic or team.")}
      className="group-manager-modal"
      returnFocusRef={returnFocusRef}
    >
      <div className="group-manager-list">
        {groups.length ? (
          groups.map((group) => (
            <GroupRow key={group.id} group={group} onChanged={onChanged} />
          ))
        ) : (
          <div className="group-manager-empty">
            <Icon name="folder" size={28} />
            <strong>{t("A place for every topic")}</strong>
            <p>
              {t(
                "Keep sales training, onboarding and technical sessions in their own groups.",
              )}
            </p>
          </div>
        )}
      </div>
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
        <button className="button primary" disabled={busy || !name.trim()}>
          <Icon name="plus" size={18} />
          {t(busy ? "Adding…" : "Add group")}
        </button>
      </form>
      <ErrorNote message={error} />
      <p className="group-manager-hint">
        {t("Move training into a group from its options menu.")}
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
    [editing, setEditing] = useState(false),
    [confirmDelete, setConfirmDelete] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const renameTrigger = useRef<HTMLButtonElement>(null),
    restoreFocus = useRef(false);
  useEffect(() => {
    if (!editing && restoreFocus.current) {
      renameTrigger.current?.focus();
      restoreFocus.current = false;
    }
  }, [editing]);
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
      restoreFocus.current = true;
      setEditing(false);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="group-manager-row">
      {confirmDelete ? (
        <div className="group-delete-confirm">
          <div>
            <strong>{t("Remove {name}?", { name: group.name })}</strong>
            <p>
              {t("Your training stays in your library, without this group.")}
            </p>
          </div>
          <div>
            <button
              className="button"
              disabled={busy}
              onClick={() => setConfirmDelete(false)}
            >
              {t("Cancel")}
            </button>
            <button
              className="button danger"
              disabled={busy}
              onClick={() => void save(true)}
            >
              {t(busy ? "Removing…" : "Remove group")}
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <Icon name="folder" size={20} />
          {editing ? (
            <input
              autoFocus
              aria-label={t("Group name")}
              value={name}
              maxLength={60}
              required
              disabled={busy}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  event.stopPropagation();
                  setEditing(false);
                  setName(group.name);
                }
              }}
            />
          ) : (
            <strong>{group.name}</strong>
          )}
          <div>
            {editing ? (
              <>
                <button
                  className="icon-button"
                  aria-label={t("Save group")}
                  disabled={busy || name === group.name || !name.trim()}
                >
                  <Icon name="check" size={18} />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={t("Cancel")}
                  disabled={busy}
                  onClick={() => {
                    restoreFocus.current = true;
                    setEditing(false);
                    setName(group.name);
                  }}
                >
                  <Icon name="close" size={18} />
                </button>
              </>
            ) : (
              <>
                <button
                  className="icon-button"
                  type="button"
                  ref={renameTrigger}
                  aria-label={t("Rename {name}", { name: group.name })}
                  onClick={() => setEditing(true)}
                >
                  <Icon name="edit" size={18} />
                </button>
                <button
                  className="icon-button"
                  type="button"
                  aria-label={t("Remove {name}", { name: group.name })}
                  onClick={() => setConfirmDelete(true)}
                >
                  <Icon name="trash" size={18} />
                </button>
              </>
            )}
          </div>
        </form>
      )}
      <ErrorNote message={error} />
    </div>
  );
}

export function TrainingCardMenu({
  course,
  groups,
  onChanged,
}: {
  course: Course;
  groups: TrainingGroup[];
  onChanged: (change: {
    action: "group" | "trash";
    groupId?: string;
    name: string;
  }) => Promise<unknown>;
}) {
  const { t } = useLocale();
  const id = useId(),
    menu = useRef<HTMLDivElement>(null),
    trigger = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 }),
    [moving, setMoving] = useState(false),
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
      trigger.current?.focus();
      await onChanged({ action, groupId, name: course.name });
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="icon-button training-card-menu-trigger"
        aria-label={t("Training options for {name}", { name: course.name })}
        popoverTarget={id}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setPosition({
            ...placePopover(event.currentTarget, 264, 320),
            left: Math.max(
              12,
              Math.min(rect.right - 264, window.innerWidth - 276),
            ),
          });
          setMoving(false);
        }}
      >
        <Icon name="more" size={22} />
      </button>
      <div
        ref={menu}
        id={id}
        popover="auto"
        className="training-card-menu"
        style={position}
      >
        {moving ? (
          <>
            <button
              className="popover-item menu-back"
              onClick={() => setMoving(false)}
            >
              <Icon name="back" size={17} />
              {t("Move to group")}
            </button>
            <div className="training-group-options">
              <button
                className="popover-item"
                disabled={busy}
                onClick={() => void update("group", "")}
              >
                <Icon name="folder" size={17} />
                <span>{t("Ungrouped")}</span>
                {!course.groupId && <Icon name="check" size={16} />}
              </button>
              {groups.map((group) => (
                <button
                  key={group.id}
                  className="popover-item"
                  disabled={busy}
                  onClick={() => void update("group", group.id)}
                >
                  <Icon name="folder" size={17} />
                  <span>{group.name}</span>
                  {course.groupId === group.id && (
                    <Icon name="check" size={16} />
                  )}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button className="popover-item" onClick={() => setMoving(true)}>
              <Icon name="folder" size={18} />
              <span>{t("Move to group")}</span>
              <Icon name="right" size={14} />
            </button>
            <hr />
            <button
              className="popover-item destructive-item"
              disabled={busy || course.status === "live"}
              title={
                course.status === "live"
                  ? t(
                      "End the live session before moving this training to Trash.",
                    )
                  : undefined
              }
              onClick={() => void update("trash")}
            >
              <Icon name="trash" size={18} />
              {t("Move to Trash")}
            </button>
          </>
        )}
        <ErrorNote message={error} />
      </div>
    </>
  );
}

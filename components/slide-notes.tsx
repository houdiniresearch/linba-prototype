"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import type { Slide } from "@/lib/types";
import { useProductLocale as useLocale } from "./product-locale";
import { api, ErrorNote, Icon } from "./ui";
export function SlideNotes({
  courseId,
  slide,
  flushRef,
}: {
  courseId: string;
  slide: Slide;
  flushRef?: RefObject<(() => Promise<void>) | null>;
}) {
  const { t } = useLocale();
  const [drafts, setDrafts] = useState<Record<string, string>>({}),
    [pending, setPending] = useState<Record<string, boolean>>({}),
    [errors, setErrors] = useState<Record<string, string>>({});
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const values = useRef(new Map<string, string>()),
    queues = useRef(new Map<string, Promise<void>>());
  const failures = useRef(new Map<string, string>());
  function save(id: string, notes: string) {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setPending((current) => ({ ...current, [id]: true }));
    const job = (queues.current.get(id) || Promise.resolve())
      .catch(() => {})
      .then(async () => {
        try {
          await api(
            `courses/${courseId}`,
            { action: "notes", slideId: id, notes },
            "PATCH",
          );
          failures.current.delete(id);
          setErrors((current) => ({ ...current, [id]: "" }));
        } catch (error) {
          failures.current.set(id, (error as Error).message);
          setErrors((current) => ({
            ...current,
            [id]: (error as Error).message,
          }));
        }
      });
    queues.current.set(id, job);
    void job.finally(() => {
      if (queues.current.get(id) === job) {
        queues.current.delete(id);
        setPending((current) => ({ ...current, [id]: false }));
      }
    });
  }
  if (flushRef)
    flushRef.current = async () => {
      for (const id of [...timers.current.keys()])
        save(id, values.current.get(id) || "");
      await Promise.all([...queues.current.values()]);
      if (failures.current.size)
        throw new Error(
          "Notes could not be saved. Try again before continuing.",
        );
    };
  useEffect(
    () => () => {
      for (const [id, timer] of timers.current) {
        clearTimeout(timer);
        save(id, values.current.get(id) || "");
      }
    },
    [courseId],
  );
  const value = drafts[slide.id] ?? slide.notes ?? "";
  return (
    <section className="slide-notes" aria-label={t("Instructor notes")}>
      <div>
        <label htmlFor="instructor-slide-notes">{t("Instructor notes")}</label>
        {pending[slide.id] && <span role="status">{t("Saving…")}</span>}
        <span>{t("Hidden from participants")}</span>
      </div>
      <textarea
        id="instructor-slide-notes"
        rows={3}
        maxLength={10000}
        placeholder={t(
          "Add a reminder, a talking point or a question for this slide…",
        )}
        value={value}
        onChange={(event) => {
          const id = slide.id,
            notes = event.target.value;
          values.current.set(id, notes);
          setDrafts((current) => ({ ...current, [id]: notes }));
          const timer = timers.current.get(id);
          if (timer) clearTimeout(timer);
          timers.current.set(
            id,
            setTimeout(() => save(id, notes), 800),
          );
        }}
        onBlur={() => {
          if (timers.current.has(slide.id)) save(slide.id, value);
        }}
      />
      <ErrorNote message={errors[slide.id]} />
      {errors[slide.id] && (
        <button className="text-button" onClick={() => save(slide.id, value)}>
          <Icon name="arrow" size={16} />
          {t("Try again")}
        </button>
      )}
    </section>
  );
}
export function EditableTrainingTitle({
  name,
  onSave,
}: {
  name: string;
  onSave: (name: string) => Promise<unknown>;
}) {
  const { t } = useLocale();
  const [editing, setEditing] = useState(false),
    [value, setValue] = useState(name),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const cancel = useRef(false),
    saving = useRef(false),
    returnFocus = useRef(false);
  const titleButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!editing && returnFocus.current) {
      titleButton.current?.focus();
      returnFocus.current = false;
    }
  }, [editing]);
  async function save() {
    if (cancel.current || saving.current) return;
    if (!value.trim() || value.trim() === name) {
      setEditing(false);
      return;
    }
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      await onSave(value.trim());
      setEditing(false);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="editable-training-name">
      {editing ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            returnFocus.current = true;
            void save();
          }}
        >
          <input
            aria-label={t("Training name")}
            autoFocus
            maxLength={120}
            value={value}
            disabled={busy}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => setValue(event.target.value)}
            onBlur={() => void save()}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                cancel.current = true;
                returnFocus.current = true;
                setEditing(false);
              }
            }}
          />
        </form>
      ) : (
        <h1 aria-label={name}>
          <button
            ref={titleButton}
            type="button"
            title={t("Rename training")}
            aria-label={t("Rename training: {name}", { name })}
            onClick={() => {
              cancel.current = false;
              setValue(name);
              setEditing(true);
            }}
          >
            {name}
            <Icon name="edit" size={15} />
          </button>
        </h1>
      )}
      <ErrorNote message={error} />
    </div>
  );
}

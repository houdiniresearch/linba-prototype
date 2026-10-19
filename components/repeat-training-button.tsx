"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowsClockwise } from "@phosphor-icons/react";
import type { Course } from "@/lib/types";
import { useLocale } from "./locale-provider";
import { api, ErrorNote, Icon } from "./ui";

export function RepeatTrainingButton({
  id,
  beforeRepeat,
}: {
  id: string;
  beforeRepeat?: () => Promise<unknown>;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const request = useRef("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="repeat-training-control">
      <button
        className="button"
        disabled={busy}
        onClick={async () => {
          if (busy) return;
          setBusy(true);
          setError("");
          request.current ||= crypto.randomUUID();
          try {
            await beforeRepeat?.();
            const result = await api<{ course: Course }>(
              `courses/${id}/repeat`,
              { requestId: request.current },
            );
            router.push(`/training/${result.course.id}`);
          } catch (error) {
            setError((error as Error).message);
            setBusy(false);
          }
        }}
      >
        {busy ? (
          <Icon name="spinner" className="spin" size={18} />
        ) : (
          <ArrowsClockwise size={18} aria-hidden="true" />
        )}
        <span>{t(busy ? "Preparing new session…" : "Use training again")}</span>
      </button>
      <ErrorNote message={error} />
    </div>
  );
}

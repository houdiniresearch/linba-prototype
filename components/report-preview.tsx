"use client";
import { useEffect, useState, type RefObject } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Report } from "./training-report";
import { useLocale } from "./locale-provider";
import { Icon } from "./ui";

export function ReportPreview({
  reportId,
  focusSection,
  onClose,
  returnFocusRef,
}: {
  reportId: string;
  focusSection: { section: string; request: number } | null;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const { t } = useLocale();
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 1200px)");
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return (
    <Dialog.Root
      open={!!focusSection}
      modal={compact}
      onOpenChange={(open) => !open && onClose()}
    >
      {compact && <Dialog.Overlay className="report-preview-overlay" />}
      <Dialog.Content
        id="report-preview"
        className="report-preview"
        aria-describedby={undefined}
        aria-modal={compact || undefined}
        onInteractOutside={(event) => {
          if (!compact) event.preventDefault();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (returnFocusRef.current?.isConnected)
            returnFocusRef.current.focus();
        }}
      >
        <div className="report-preview-heading">
          <Icon name="chart" size={20} />
          <Dialog.Title>{t("Training report")}</Dialog.Title>
          <Dialog.Close className="icon-button" aria-label={t("Close report")}>
            <Icon name="close" size={20} />
          </Dialog.Close>
        </div>
        <div className="report-preview-content" key={reportId}>
          <Report
            id={reportId}
            embedded
            focusSection={focusSection || undefined}
          />
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}

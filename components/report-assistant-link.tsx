"use client";
import { AgentMark } from "./agent-identity";
import { useLocale } from "./locale-provider";
import { Icon } from "./ui";

export function ReportAssistantLink({ id }: { id?: string }) {
  const { t } = useLocale();
  return (
    <a
      className="button ai-button"
      href={`/report-agent${id ? `?report=${encodeURIComponent(id)}` : ""}`}
      target="_blank"
      rel="noreferrer"
    >
      <AgentMark size={20} />
      {t("Report agent")}
      <Icon name="external" size={16} />
    </a>
  );
}

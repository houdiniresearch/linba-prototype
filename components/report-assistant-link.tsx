"use client";
import { AgentMark } from "./agent-identity";
import { useProductLocale as useLocale } from "./product-locale";
import { Icon } from "./ui";

export function ReportAssistantLink({ id }: { id?: string }) {
  const { t } = useLocale();
  return (
    <a
      className="button ai-orbit-button"
      href={`/report-agent${id ? `?report=${encodeURIComponent(id)}` : ""}`}
      target="_blank"
      rel="noreferrer"
    >
      <AgentMark size={20} />
      {t("Ask Linba")}
      <Icon name="external" size={16} />
    </a>
  );
}

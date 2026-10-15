"use client";

import { Icon } from "./ui";
import { useLocale } from "./locale-provider";

type Operation = "training" | "personas" | "report" | "feedback" | "activity";

const operations = {
  training: {
    icon: "presentation",
    title: "Eğitimin hazırlanıyor",
    description: "Sunumun işleniyor ve slaytların eğitim akışına hazırlanıyor.",
  },
  personas: {
    icon: "users",
    title: "Prova katılımcıların hazırlanıyor",
    description:
      "Tarif ettiğin kitleye göre farklı deneyimleri, beklentileri ve soruları olan katılımcılar oluşturuluyor.",
  },
  report: {
    icon: "chart",
    title: "Eğitimin tamamlanıyor",
    description:
      "Sorular ve aktivite sonuçları raporun için bir araya getiriliyor.",
  },
  feedback: {
    icon: "chart",
    title: "Provan değerlendiriliyor",
    description:
      "Konuşman ve katılımcı yorumları üzerinden geri bildirimin hazırlanıyor.",
  },
  activity: {
    icon: "activity",
    title: "Aktiviten hazırlanıyor",
    description:
      "Seçili slaydın içeriğinden bir aktivite taslağı oluşturuluyor.",
  },
} as const;

/** Indeterminate feedback: no simulated percentages or backend milestones. */
export function OperationProgress({
  kind,
  compact = false,
}: {
  kind: Operation;
  compact?: boolean;
}) {
  const { t } = useLocale();
  const operation = operations[kind];
  return (
    <div
      className={`operation-progress operation-${kind}${compact ? " operation-compact" : ""}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="operation-scene" aria-hidden="true">
        <span className="operation-tile operation-tile-back">
          <Icon name={operation.icon} size={24} />
        </span>
        <span className="operation-tile operation-tile-front">
          <Icon name={operation.icon} size={32} />
          <span className="operation-mini-lines">
            <i />
            <i />
          </span>
        </span>
        <span className="operation-spark">
          <Icon name="sparkle" size={20} />
        </span>
      </div>
      <div className="operation-copy">
        <strong>{t(operation.title)}</strong>
        <p>{t(operation.description)}</p>
      </div>
      <span className="operation-pulse" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}

export function ThinkingDots() {
  return (
    <span className="operation-pulse" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

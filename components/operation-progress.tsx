"use client";

import { Icon } from "./ui";
import { AgentMark } from "./agent-identity";
import { useLocale } from "./locale-provider";

type Operation = "training" | "personas" | "report" | "feedback" | "activity";

const operations = {
  training: {
    icon: "presentation",
    title: "Preparing your training",
    description:
      "Your presentation is being processed and its slides prepared for your training.",
  },
  personas: {
    icon: "users",
    title: "Creating your practice participants",
    description:
      "Participants with different experiences, expectations and questions are being created based on your audience description.",
  },
  report: {
    icon: "chart",
    title: "Completing your training",
    description:
      "Questions and activity results are being brought together for your report.",
  },
  feedback: {
    icon: "chart",
    title: "Reviewing your practice",
    description:
      "Your feedback is being prepared from your conversation and participant comments.",
  },
  activity: {
    icon: "activity",
    title: "Preparing your activity",
    description:
      "An activity draft is being created from the selected slide’s content.",
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
        <div className="operation-source-frame">
          <Icon name={operation.icon} size={25} />
          <span className="operation-source-rules">
            <i />
            <i />
            <i />
          </span>
        </div>
        <span className="operation-agent-seal">
          <AgentMark size={35} />
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

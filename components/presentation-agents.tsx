"use client";

import { useEffect, useState } from "react";
import { presentationElapsedMs } from "@/lib/presentation-clock";
import type { Course } from "@/lib/types";
import { AgentMark } from "./agent-identity";
import { useProductLocale } from "./product-locale";
import { Icon } from "./ui";

export const presentationAgentRoles = [
  {
    id: "learning",
    name: "Learning agent",
    description:
      "Answers participants’ questions using your presentation materials and explains the topics they need help with.",
  },
  {
    id: "engagement",
    name: "Engagement agent",
    description:
      "Designs activities in real time to suit the flow of your presentation and keep participants involved.",
  },
  {
    id: "assessment",
    name: "Assessment agent",
    description:
      "Evaluates participant responses to help you identify what they understand and where learning gaps remain.",
  },
] as const;

export function PresentationAgents() {
  const { t } = useProductLocale();
  return (
    <div className="presentation-agents">
      <p className="agent-roster-intro">
        {t("3 AI agents to accompany your presentation")}
      </p>
      <ul className="presentation-agent-list">
        {presentationAgentRoles.map((role) => (
          <li
            key={role.id}
            className={`presentation-agent agent-role-${role.id}`}
          >
            <span className="presentation-agent-symbol">
              <AgentMark size={25} />
            </span>
            <div>
              <h3>{t(role.name)}</h3>
              <p>{t(role.description)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LiveElapsedTime({ course }: { course: Course }) {
  const { t } = useProductLocale();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    if (course.pausedAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [course.pausedAt]);
  const elapsed = presentationElapsedMs(course, now ?? undefined);
  if (elapsed === null || now === null) return null;
  const seconds = Math.floor(elapsed / 1000);
  const duration = [
    Math.floor(seconds / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
  return (
    <span
      className="live-elapsed-time"
      role="timer"
      aria-label={t("Elapsed time")}
    >
      <Icon name="clock" size={15} />
      {duration}
    </span>
  );
}

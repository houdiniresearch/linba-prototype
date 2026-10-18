"use client";

import Image from "next/image";

/** The original folded LİNBA symbol, optically framed for small UI contexts. */
export function AgentMark({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={`agent-mark ${className}`}
      width={size}
      height={size}
      viewBox="-22 -8 234 234"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <image href="/brand/linba-logo-color.svg" width="700" height="214" />
    </svg>
  );
}

/** Context illustrations share LİNBA's human, folded-paper visual language. */
export function AgentIllustration({
  kind = "report",
}: {
  kind?: "report" | "practice" | "learning";
}) {
  return (
    <div
      className={`agent-illustration agent-illustration-${kind}`}
      aria-hidden="true"
    >
      <Image
        src={`/agents/${kind}-editorial.webp`}
        alt=""
        width={800}
        height={600}
        unoptimized
        loading="eager"
      />
    </div>
  );
}

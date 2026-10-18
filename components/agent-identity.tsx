"use client";

import { useState } from "react";

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

/** A source folio, using the actual training page rather than invented analytics. */
export function AgentSourceFolio({
  courseId,
  pageNumber,
  kind = "report",
}: {
  courseId: string;
  pageNumber?: number;
  kind?: "report" | "practice" | "learning";
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={`agent-source-folio agent-source-${kind}`}
      aria-hidden="true"
    >
      <span className="agent-folio-back" />
      <span className="agent-folio-index">
        <i />
        <i />
        <i />
      </span>
      <div className="agent-folio-page">
        <div className="agent-folio-source">
          {pageNumber && !failed ? (
            <img
              src={`/api/courses/${courseId}/page/${pageNumber}`}
              alt=""
              onError={() => setFailed(true)}
            />
          ) : (
            <div className="agent-folio-source-fallback">
              <span />
              <span />
              <span />
            </div>
          )}
        </div>
        <div className="agent-folio-annotation">
          {kind === "practice" ? (
            <span className="agent-folio-voice">
              {[7, 13, 20, 12, 24, 15, 9].map((height, index) => (
                <i key={index} style={{ height }} />
              ))}
            </span>
          ) : (
            <span className="agent-folio-references">
              <i />
              <i />
              <i />
            </span>
          )}
          <AgentMark size={26} />
        </div>
      </div>
    </div>
  );
}

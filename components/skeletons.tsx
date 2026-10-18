"use client";
import { createContext, useContext, type ReactNode } from "react";
import { useLocale } from "./locale-provider";
import { Logo } from "./ui";
const SkeletonContext = createContext(false);

export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`sk ${className}`} />;
}
function Region({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const { t } = useLocale();
  const nested = useContext(SkeletonContext);
  return (
    <div
      className={`skeleton-region ${className}`}
      role={nested ? undefined : "status"}
      aria-busy={nested ? undefined : true}
    >
      <SkeletonContext.Provider value={true}>
        {!nested && <span className="sr-only">{t("Loading…")}</span>}
        {children}
      </SkeletonContext.Provider>
    </div>
  );
}
function Lines({ count = 3 }: { count?: number }) {
  return (
    <div className="sk-lines" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton
          key={i}
          className={i === count - 1 ? "sk-line sk-medium" : "sk-line"}
        />
      ))}
    </div>
  );
}
function Title() {
  return (
    <div className="sk-heading" aria-hidden="true">
      <Skeleton className="sk-title" />
      <Skeleton className="sk-line sk-medium" />
    </div>
  );
}
function Card() {
  return (
    <div className="sk-card" aria-hidden="true">
      <Skeleton className="sk-cover" />
      <div className="sk-card-body">
        <Skeleton className="sk-tag" />
        <Skeleton className="sk-line" />
        <Skeleton className="sk-line sk-short" />
      </div>
    </div>
  );
}
export function CardListSkeleton() {
  return (
    <Region className="training-grid">
      {[0, 1, 2].map((i) => (
        <Card key={i} />
      ))}
    </Region>
  );
}
export function AuthSkeleton() {
  return (
    <Region className="auth-screen">
      <header>
        <Logo />
      </header>
      <div className="auth-layout" aria-hidden="true">
        <div className="auth-copy">
          <Skeleton className="sk-auth-display" />
          <Lines />
        </div>
        <div className="auth-form">
          <Title />
          {[0, 1, 2].map((index) => (
            <div key={index} className="sk-auth-field">
              <Skeleton className="sk-line sk-short" />
              <Skeleton className="sk-auth-input" />
            </div>
          ))}
          <Skeleton className="sk-auth-input" />
        </div>
      </div>
    </Region>
  );
}
export function ReportTableSkeleton() {
  return (
    <Region className="table-wrap sk-table">
      <div className="sk-table-head" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="sk-line" />
        ))}
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div className="sk-table-row" key={i} aria-hidden="true">
          <Skeleton className="sk-line" />
          <Skeleton className="sk-line sk-medium" />
          <Skeleton className="sk-line sk-medium" />
          <Skeleton className="sk-dot" />
        </div>
      ))}
    </Region>
  );
}
export function DashboardContentSkeleton({ view = "home" }: { view?: string }) {
  return (
    <Region className="sk-dashboard-content">
      <Title />
      <div className="sk-actions" aria-hidden="true">
        <Skeleton className="sk-button" />
        <Skeleton className="sk-line sk-medium" />
      </div>
      {view === "reports" ? (
        <ReportTableSkeleton />
      ) : (
        <div className="training-grid">
          {[0, 1, 2].map((i) => (
            <Card key={i} />
          ))}
        </div>
      )}
    </Region>
  );
}
export function DashboardSkeleton({ view = "home" }: { view?: string }) {
  return (
    <Region className="app-shell sk-app-shell">
      <header className="app-header" aria-hidden="true">
        <Logo />
        <Skeleton className="sk-search" />
        <div className="sk-header-tools">
          <Skeleton className="sk-dot" />
          <Skeleton className="sk-button" />
          <Skeleton className="sk-avatar" />
        </div>
      </header>
      <aside className="sidebar" aria-hidden="true">
        <div className="sk-nav">
          <Skeleton className="sk-nav-item" />
          <Skeleton className="sk-nav-item" />
          <Skeleton className="sk-nav-item" />
        </div>
      </aside>
      <main className="dashboard-main">
        <DashboardContentSkeleton view={view} />
      </main>
    </Region>
  );
}
export function ReportDetailSkeleton() {
  return (
    <Region className="report-detail sk-report-detail">
      <Skeleton className="sk-line sk-short" />
      <Title />
      <div className="metrics" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <Skeleton className="sk-number" />
            <Skeleton className="sk-line" />
          </div>
        ))}
      </div>
      {[0, 1, 2].map((i) => (
        <div className="report-section" key={i} aria-hidden="true">
          <Skeleton className="sk-subtitle" />
          <Lines count={i === 0 ? 4 : 2} />
        </div>
      ))}
    </Region>
  );
}
export function SlideSkeleton({ small = false }: { small?: boolean }) {
  const content = (
    <div className="sk-slide-content" aria-hidden="true">
      <Skeleton className="sk-title" />
      <Lines />
      <Skeleton className="sk-slide-visual" />
    </div>
  );
  return small ? (
    <div className="sk-slide-placeholder" aria-hidden="true">
      {content}
    </div>
  ) : (
    <Region className="sk-slide-placeholder">{content}</Region>
  );
}
export function EditorSkeleton({ live = false }: { live?: boolean }) {
  return (
    <Region
      className={`editor-shell sk-editor-shell ${live ? "live-shell" : ""}`}
    >
      <header className="editor-header" aria-hidden="true">
        <Skeleton className="sk-dot" />
        <div className="sk-editor-title">
          <Skeleton className="sk-subtitle" />
          <Skeleton className="sk-line sk-medium" />
        </div>
        <div className="sk-header-tools">
          <Skeleton className="sk-button" />
          <Skeleton className="sk-button" />
        </div>
      </header>
      <aside className="slide-rail sk-slide-rail" aria-hidden="true">
        <Skeleton className="sk-line sk-medium" />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="sk-thumbnail" />
        ))}
      </aside>
      <main className="editor-stage">
        <div className="stage-top" aria-hidden="true">
          <Skeleton className="sk-line sk-short" />
        </div>
        <div className="presentation-canvas sk-canvas">
          <div className="canvas-join" aria-hidden="true">
            <Skeleton className="sk-line sk-short" />
            <Logo />
          </div>
          <div className="sk-canvas-body">
            <SlideSkeleton />
          </div>
        </div>
      </main>
      {live ? (
        <aside className="sk-editor-panel" aria-hidden="true">
          <Skeleton className="sk-subtitle" />
          <Lines />
          <Skeleton className="sk-button" />
          <Lines count={4} />
        </aside>
      ) : (
        <aside className="editor-tool-dock sk-editor-dock" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton className="sk-dot" key={i} />
          ))}
        </aside>
      )}
    </Region>
  );
}
export function RehearsalSkeleton() {
  return (
    <Region className="rehearsal-page sk-rehearsal-shell">
      <header className="editor-header" aria-hidden="true">
        <Skeleton className="sk-dot" />
        <Skeleton className="sk-subtitle" />
        <div className="sk-header-tools">
          <Logo />
        </div>
      </header>
      <main className="rehearsal-setup sk-rehearsal">
        <Skeleton className="sk-avatar" />
        <Title />
        <Lines count={2} />
        <Skeleton className="sk-textarea" />
        <Skeleton className="sk-button" />
      </main>
    </Region>
  );
}
export function ParticipantSkeleton() {
  return (
    <Region className="participant-app sk-participant">
      <header aria-hidden="true">
        <Skeleton className="sk-dot" />
        <Logo />
        <Skeleton className="sk-avatar" />
      </header>
      <div className="participant-course-title" aria-hidden="true">
        <Skeleton className="sk-subtitle" />
        <Skeleton className="sk-line sk-medium" />
      </div>
      <div className="sk-participant-tabs" aria-hidden="true">
        <Skeleton className="sk-button" />
        <Skeleton className="sk-button" />
      </div>
      <div className="sk-participant-content" aria-hidden="true">
        <Skeleton className="sk-title" />
        <Lines />
        {[0, 1, 2].map((i) => (
          <Skeleton className="sk-answer" key={i} />
        ))}
      </div>
    </Region>
  );
}
export function ParticipantListSkeleton() {
  return (
    <Region className="sk-participant-list">
      {[0, 1, 2].map((i) => (
        <div key={i} className="sk-table-row" aria-hidden="true">
          <Skeleton className="sk-dot" />
          <Skeleton className="sk-line" />
          <Skeleton className="sk-tag" />
        </div>
      ))}
    </Region>
  );
}
export function ProjectionSkeleton() {
  return (
    <Region className="projection sk-projection">
      <header aria-hidden="true">
        <Skeleton className="sk-line sk-medium" />
        <Logo />
      </header>
      <div className="sk-projection-stage">
        <SlideSkeleton />
      </div>
      <footer aria-hidden="true">
        <Skeleton className="sk-line sk-medium" />
        <Skeleton className="sk-dot" />
      </footer>
    </Region>
  );
}
export function PreviewSkeleton() {
  return (
    <Region className="preview-page">
      <header aria-hidden="true">
        <Skeleton className="sk-dot" />
        <Skeleton className="sk-subtitle" />
        <Logo />
      </header>
      <div className="preview-layout">
        <section>
          <Skeleton className="sk-subtitle" />
          <div className="presentation-canvas sk-canvas">
            <div className="sk-canvas-body">
              <SlideSkeleton />
            </div>
          </div>
        </section>
        <section>
          <Skeleton className="sk-subtitle" />
          <div className="phone-preview">
            <Logo />
            <Lines />
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="sk-answer" />
            ))}
          </div>
        </section>
      </div>
    </Region>
  );
}
export function ReportListSkeleton() {
  return (
    <Region className="sk-report-list">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="sk-report-item" aria-hidden="true">
          <Skeleton className="sk-dot" />
          <div>
            <Skeleton className="sk-line" />
            <Skeleton className="sk-line sk-medium" />
          </div>
        </div>
      ))}
    </Region>
  );
}
export function ReportConversationSkeleton() {
  return (
    <Region className="report-conversation sk-report-conversation">
      <div className="report-transcript">
        <div className="report-thread-inner" aria-hidden="true">
          <div className="sk-chat-user">
            <Skeleton className="sk-line" />
          </div>
          <div className="sk-chat-answer">
            <Skeleton className="sk-dot" />
            <Lines count={4} />
          </div>
          <div className="sk-chat-user">
            <Skeleton className="sk-line" />
          </div>
          <div className="sk-chat-answer">
            <Skeleton className="sk-dot" />
            <Lines count={3} />
          </div>
        </div>
      </div>
      <div className="report-composer-area" aria-hidden="true">
        <Skeleton className="sk-composer" />
      </div>
    </Region>
  );
}
export function ReportWorkspaceSkeleton() {
  return (
    <Region className="report-assistant-shell sk-report-shell">
      <aside className="report-chat-sidebar">
        <div className="report-sidebar-brand" aria-hidden="true">
          <Logo />
        </div>
        <div className="sk-report-sidebar-heading" aria-hidden="true">
          <Skeleton className="sk-subtitle" />
          <Skeleton className="sk-search" />
        </div>
        <ReportListSkeleton />
      </aside>
      <main className="report-chat-main">
        <header className="report-chat-header" aria-hidden="true">
          <Skeleton className="sk-subtitle" />
          <div className="sk-header-tools">
            <Skeleton className="sk-dot" />
          </div>
        </header>
        <ReportConversationSkeleton />
      </main>
    </Region>
  );
}

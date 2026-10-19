"use client";
import { ThinkingDots } from "./operation-progress";
import { AgentMark, AgentIllustration } from "./agent-identity";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { User } from "@/lib/types";
import type { ReportChat, ReportItem, ReportTurn } from "@/lib/report-chat";
import { ReportPreview } from "./report-preview";
import { Auth } from "./auth";
import {
  ReportConversationSkeleton,
  ReportListSkeleton,
  ReportWorkspaceSkeleton,
  Skeleton,
} from "./skeletons";
import { useLocale } from "./locale-provider";
import {
  api,
  dateTime,
  Empty,
  ErrorNote,
  Icon,
  ResourceFailure,
  Logo,
  useResource,
} from "./ui";

export function ReportAssistant() {
  const { t } = useLocale();
  const auth = useResource<{ user?: User }>("auth");
  if (!auth.data)
    return auth.error ? (
      <ResourceFailure error={auth.error} onRetry={auth.refresh} />
    ) : (
      <ReportWorkspaceSkeleton />
    );
  if (!auth.data.user) return <Auth onDone={() => void auth.refresh()} />;
  if (auth.data.user.role !== "teacher")
    return (
      <main className="participant-gate">
        <Logo />
        <Empty
          icon="chart"
          title={t("The report agent is available to instructor accounts.")}
          description=""
        />
        <a className="button" href="/">
          {t("Back to workspace")}
        </a>
      </main>
    );
  return <ReportWorkspace user={auth.data.user} />;
}

function ReportWorkspace({ user }: { user: User }) {
  const { t, locale } = useLocale();
  const router = useRouter(),
    params = useSearchParams();
  const reports = useResource<{ reports: ReportItem[] }>("report-assistant");
  const [search, setSearch] = useState(""),
    [mobile, setMobile] = useState(false);
  const [preview, setPreview] = useState<{
    section: string;
    request: number;
  } | null>(null);
  const reportTrigger = useRef<HTMLElement | null>(null);
  function openReport(section: string, trigger: HTMLElement) {
    reportTrigger.current = trigger;
    setPreview({ section: `report-${section}`, request: Date.now() });
  }
  const requested = params.get("report");
  const selected = requested
    ? reports.data?.reports.find((r) => r.id === requested)
    : reports.data?.reports[0];
  const list =
    reports.data?.reports.filter((r) =>
      r.name
        .toLocaleLowerCase(locale)
        .includes(search.toLocaleLowerCase(locale)),
    ) || [];
  const menuButton = useRef<HTMLButtonElement>(null),
    sidebar = useRef<HTMLElement>(null),
    wasMobileOpen = useRef(false);
  useEffect(() => {
    if (!mobile) {
      if (wasMobileOpen.current) menuButton.current?.focus();
      wasMobileOpen.current = false;
      return;
    }
    wasMobileOpen.current = true;
    sidebar.current
      ?.querySelector<HTMLButtonElement>(".report-sidebar-close")
      ?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobile(false);
        menuButton.current?.focus();
      }
    };
    const resize = () => {
      if (window.innerWidth > 760) setMobile(false);
    };
    window.addEventListener("keydown", close);
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("keydown", close);
      window.removeEventListener("resize", resize);
    };
  }, [mobile]);
  return (
    <div className={`report-assistant-shell ${mobile ? "reports-open" : ""}`}>
      {mobile && (
        <button
          className="report-sidebar-overlay"
          aria-label={t("Close report list")}
          onClick={() => {
            setMobile(false);
            menuButton.current?.focus();
          }}
        />
      )}
      <aside
        ref={sidebar}
        className="report-chat-sidebar"
        aria-label={t("Your reports")}
      >
        <div className="report-sidebar-brand">
          <a href="/?view=reports" aria-label={t("Back to reports")}>
            <Logo />
          </a>
          <button
            className="icon-button report-sidebar-close"
            onClick={() => {
              setMobile(false);
              menuButton.current?.focus();
            }}
            aria-label={t("Close report list")}
          >
            <Icon name="close" />
          </button>
        </div>
        <a className="button report-workspace-back" href="/?view=reports">
          <Icon name="back" size={19} />
          {t("Back to reports")}
        </a>
        <h2>{t("Your reports")}</h2>
        <label className="report-search">
          <Icon name="search" size={18} />
          <input
            aria-label={t("Search reports")}
            placeholder={t("Search reports…")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <nav className="report-chat-list" aria-label={t("Choose a report")}>
          {reports.error && (
            <>
              <ErrorNote message={reports.error} />
              <button
                className="text-button"
                onClick={() => void reports.refresh()}
              >
                {t("Try again")}
              </button>
            </>
          )}
          {!reports.data ? (
            reports.error ? null : (
              <ReportListSkeleton />
            )
          ) : list.length ? (
            list.map((r) => (
              <button
                key={r.id}
                className="report-chat-item"
                aria-current={r.id === selected?.id ? "page" : undefined}
                onClick={() => {
                  router.push(
                    `/report-agent?report=${encodeURIComponent(r.id)}`,
                  );
                  setPreview((current) =>
                    current
                      ? { section: "report-top", request: Date.now() }
                      : null,
                  );
                  setMobile(false);
                }}
              >
                <Icon name="chart" size={18} />
                <span>
                  <strong>{r.name}</strong>
                  <small>
                    {t("Session {number}", { number: r.sessionNumber || 1 })}
                    {r.endedAt &&
                      ` · ${dateTime(r.startedAt || r.endedAt, locale)}`}
                  </small>
                </span>
              </button>
            ))
          ) : (
            <p className="small muted report-list-empty">
              {t(
                search
                  ? "No reports match your search."
                  : "Your completed training sessions appear here.",
              )}
            </p>
          )}
        </nav>
        <div className="report-sidebar-footer">
          <span className="avatar">{user.name.slice(0, 1)}</span>
          <span>{user.name}</span>
        </div>
      </aside>
      <main className="report-chat-main" inert={mobile || undefined}>
        <header className="report-chat-header">
          <button
            ref={menuButton}
            className="icon-button report-list-trigger"
            aria-label={t("Open report list")}
            aria-expanded={mobile}
            onClick={() => setMobile(true)}
          >
            <Icon name="menu" />
          </button>
          <div>
            <span className="small muted">{t("Report agent")}</span>
            <h1>
              {!reports.data ? (
                <Skeleton className="sk-subtitle" />
              ) : (
                selected?.name || t("Let’s explore your reports")
              )}
            </h1>
          </div>
          <div className="report-header-tools">
            {selected && (
              <button
                className="button"
                aria-label={t("Open report")}
                aria-expanded={!!preview}
                aria-controls={preview ? "report-preview" : undefined}
                onClick={(event) =>
                  preview
                    ? setPreview(null)
                    : openReport("top", event.currentTarget)
                }
              >
                <Icon name="chart" size={17} />
                <span>{t("Open report")}</span>
              </button>
            )}
          </div>
        </header>
        <div
          className={`report-chat-body ${preview && selected ? "report-preview-open" : ""}`}
        >
          {!reports.data ? (
            reports.error ? (
              <ResourceFailure
                error={reports.error}
                onRetry={reports.refresh}
              />
            ) : (
              <ReportConversationSkeleton />
            )
          ) : selected ? (
            <ReportConversation
              key={selected.id}
              report={selected}
              onOpenReport={openReport}
            />
          ) : (
            <div className="report-chat-fallback">
              <Empty
                icon="chart"
                title={t(
                  requested ? "Report not found" : "No completed training yet",
                )}
                description={t(
                  requested
                    ? "Choose another report from the list."
                    : "Once training is complete, we can discuss its report here.",
                )}
              />
              <a className="button" href="/?view=courses">
                {t("Back to my training")}
              </a>
            </div>
          )}
          {selected && (
            <ReportPreview
              reportId={selected.id}
              focusSection={preview}
              onClose={() => setPreview(null)}
              returnFocusRef={reportTrigger}
            />
          )}
        </div>
      </main>
    </div>
  );
}

const suggestions = [
  "What stood out in this training?",
  "Where did students need the most support?",
  "Summarize the activity responses.",
  "What can we improve in the next training?",
];
function ReportConversation({
  report,
  onOpenReport,
}: {
  report: ReportItem;
  onOpenReport: (section: string, trigger: HTMLElement) => void;
}) {
  const { t, locale } = useLocale();
  const chat = useResource<ReportChat>(`report-assistant/${report.id}`, 3000);
  const [draft, setDraft] = useState(""),
    [error, setError] = useState("");
  const [sending, setSending] = useState<{
    requestId: string;
    question: string;
  } | null>(null);
  const [confirmed, setConfirmed] = useState<ReportTurn[]>([]);
  const request = useRef<{ id: string; text: string } | null>(null),
    bottom = useRef<HTMLDivElement>(null);
  const turns = useMemo(
    () =>
      [
        ...new Map(
          [...(chat.data?.turns || []), ...confirmed].map((turn) => [
            turn.id,
            turn,
          ]),
        ).values(),
      ].sort(
        (a, b) =>
          a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
      ),
    [chat.data?.turns, confirmed],
  );
  const pendingCandidate = chat.data?.pending || sending;
  const pending =
    pendingCandidate &&
    !turns.some((turn) => turn.requestId === pendingCandidate.requestId)
      ? pendingCandidate
      : null;
  const busy = !!sending || !!pending;
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [turns.length, !!pending]);
  async function send(message = draft) {
    const question = message.trim();
    if (!question || busy || !chat.data?.aiReady) return;
    const requestId =
      request.current?.text === question
        ? request.current.id
        : Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
            byte.toString(16).padStart(2, "0"),
          ).join("");
    request.current = { id: requestId, text: question };
    setSending({ requestId, question });
    setDraft("");
    setError("");
    try {
      const result = await api<ReportChat>(`report-assistant/${report.id}`, {
        message: question,
        requestId,
        previousTurnId: turns.at(-1)?.id || null,
        locale,
      });
      setConfirmed(result.turns);
      chat.setData(result);
      request.current = null;
    } catch (e) {
      setDraft(question);
      setError((e as Error).message);
      await chat.refresh();
    } finally {
      setSending(null);
    }
  }
  if (!chat.data)
    return chat.error ? (
      <ResourceFailure error={chat.error} onRetry={chat.refresh} />
    ) : (
      <ReportConversationSkeleton />
    );
  return (
    <div className="report-conversation">
      {turns.length || pending ? (
        <div
          className="report-transcript"
          role="log"
          aria-label={t("Report conversation")}
          aria-live="polite"
          aria-relevant="additions"
        >
          <div className="report-thread-inner">
            {turns.map((turn) => (
              <div className="report-turn" key={turn.id}>
                <div className="report-user-message">
                  <span className="sr-only">{t("You")}: </span>
                  {turn.question}
                </div>
                <div className="report-assistant-message">
                  <AgentMark size={26} />
                  <div>
                    <span className="sr-only">{t("Report agent")}: </span>
                    <p>{turn.answer}</p>
                    {turn.sources.length > 0 && (
                      <div
                        className="report-chat-sources"
                        aria-label={t("Sources")}
                      >
                        {turn.sources.map((source) => (
                          <button
                            key={source.id}
                            onClick={(event) =>
                              onOpenReport(source.section, event.currentTarget)
                            }
                          >
                            <Icon name="chart" size={14} />
                            {t(source.label)}
                            <Icon name="arrow" size={12} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {pending && (
              <div className="report-turn">
                <div className="report-user-message">{pending.question}</div>
                <div
                  className="report-assistant-message report-answer-pending"
                  role="status"
                >
                  <AgentMark size={26} />
                  <span>{t("Reviewing your report…")}</span>
                  <ThinkingDots />
                </div>
              </div>
            )}
            <div ref={bottom} />
          </div>
        </div>
      ) : (
        <div className="report-chat-welcome">
          <AgentIllustration kind="report" />
          <h2>{t("Let’s explore this report together.")}</h2>
          <p>
            {t(
              "Explore the questions, participation and activity responses in this training.",
            )}
          </p>
        </div>
      )}
      <div className="report-composer-area">
        {!turns.length && !pending && (
          <div className="report-suggestions">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                disabled={!chat.data?.aiReady}
                onClick={() => void send(t(suggestion))}
              >
                <span>{t(suggestion)}</span>
                <Icon name="arrow" size={15} />
              </button>
            ))}
          </div>
        )}
        <ErrorNote message={error || chat.error} />
        {!chat.data.aiReady && (
          <p className="small muted">
            {t("Configure the model connection to use the report agent.")}
          </p>
        )}
        <form
          className="report-composer"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <textarea
            rows={2}
            maxLength={3000}
            value={draft}
            disabled={busy || !chat.data.aiReady}
            aria-label={t("Write a question about this report")}
            placeholder={t("Ask something about this report…")}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <button
            className="button primary report-send"
            disabled={!draft.trim() || busy || !chat.data.aiReady}
            aria-label={t("Send")}
            type="submit"
          >
            <Icon
              name={busy ? "spinner" : "up"}
              className={busy ? "spin" : undefined}
              size={21}
            />
          </button>
        </form>
        <p className="report-composer-note">
          {t("Answers use only the selected report’s records.")}
        </p>
      </div>
    </div>
  );
}

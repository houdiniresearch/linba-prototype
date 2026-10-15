"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { User } from "@/lib/types";
import type { ReportChat, ReportItem, ReportTurn } from "@/lib/report-chat";
import { Auth } from "./auth";
import { ThemeMenu } from "./theme-menu";
import {
  ReportConversationSkeleton,
  ReportListSkeleton,
  ReportWorkspaceSkeleton,
  Skeleton,
} from "./skeletons";
import { useLocale } from "./locale-provider";
import {
  api,
  date,
  Empty,
  ErrorNote,
  Icon,
  ResourceFailure,
  Logo,
  useResource,
} from "./ui";

export function ReportAssistantLink({ id }: { id?: string }) {
  const { t } = useLocale();
  return (
    <a
      className="button ai-button"
      href={`/rapor-asistani${id ? `?rapor=${encodeURIComponent(id)}` : ""}`}
      target="_blank"
      rel="noreferrer"
    >
      <Icon name="sparkle" size={18} />
      {t("Rapor asistanı")}
      <Icon name="external" size={16} />
    </a>
  );
}

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
          title={t("Rapor asistanı eğitmen hesabında kullanılabilir.")}
          description=""
        />
        <a className="button" href="/">
          {t("Çalışma alanına dön")}
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
  const requested = params.get("rapor");
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
          aria-label={t("Rapor listesini kapat")}
          onClick={() => {
            setMobile(false);
            menuButton.current?.focus();
          }}
        />
      )}
      <aside
        ref={sidebar}
        className="report-chat-sidebar"
        aria-label={t("Raporların")}
      >
        <div className="report-sidebar-brand">
          <a href="/?view=reports" aria-label={t("Raporlara dön")}>
            <Logo />
          </a>
          <button
            className="icon-button report-sidebar-close"
            onClick={() => {
              setMobile(false);
              menuButton.current?.focus();
            }}
            aria-label={t("Rapor listesini kapat")}
          >
            <Icon name="close" />
          </button>
        </div>
        <a className="text-button report-workspace-back" href="/?view=reports">
          <Icon name="back" size={17} />
          {t("Raporlara dön")}
        </a>
        <h2>{t("Raporların")}</h2>
        <label className="report-search">
          <Icon name="search" size={18} />
          <input
            aria-label={t("Raporlarda ara")}
            placeholder={t("Raporlarda ara…")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <nav className="report-chat-list" aria-label={t("Rapor seç")}>
          {reports.error && (
            <>
              <ErrorNote message={reports.error} />
              <button
                className="text-button"
                onClick={() => void reports.refresh()}
              >
                {t("Yeniden dene")}
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
                    `/rapor-asistani?rapor=${encodeURIComponent(r.id)}`,
                  );
                  setMobile(false);
                }}
              >
                <Icon name="chart" size={18} />
                <span>
                  <strong>{r.name}</strong>
                  <small>
                    {r.endedAt
                      ? `${date(r.endedAt, locale)} · ${new Date(r.endedAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" })}`
                      : ""}
                  </small>
                </span>
              </button>
            ))
          ) : (
            <p className="small muted report-list-empty">
              {t(
                search
                  ? "Aramana uygun rapor bulunamadı."
                  : "Tamamlanan eğitimlerin burada listelenir.",
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
            aria-label={t("Rapor listesini aç")}
            aria-expanded={mobile}
            onClick={() => setMobile(true)}
          >
            <Icon name="menu" />
          </button>
          <div>
            <span className="small muted">{t("Rapor asistanı")}</span>
            <h1>
              {!reports.data ? (
                <Skeleton className="sk-subtitle" />
              ) : (
                selected?.name || t("Raporlarını birlikte inceleyelim")
              )}
            </h1>
          </div>
          <div className="report-header-tools">
            {selected && (
              <a
                className="button"
                href={`/?view=reports&report=${selected.id}`}
                aria-label={t("Raporu aç")}
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="chart" size={17} />
                <span>{t("Raporu aç")}</span>
              </a>
            )}
            <ThemeMenu />
          </div>
        </header>
        {!reports.data ? (
          reports.error ? (
            <ResourceFailure error={reports.error} onRetry={reports.refresh} />
          ) : (
            <ReportConversationSkeleton />
          )
        ) : selected ? (
          <ReportConversation key={selected.id} report={selected} />
        ) : (
          <div className="report-chat-fallback">
            <Empty
              icon="chart"
              title={t(
                requested
                  ? "Rapor bulunamadı"
                  : "Henüz tamamlanmış eğitimin yok",
              )}
              description={t(
                requested
                  ? "Soldaki listeden başka bir rapor seçebilirsin."
                  : "Eğitimini tamamladığında raporunu burada konuşabiliriz.",
              )}
            />
            <a className="button" href="/?view=courses">
              {t("Eğitimlerime dön")}
            </a>
          </div>
        )}
      </main>
    </div>
  );
}

const suggestions = [
  "Bu eğitimde neler öne çıktı?",
  "En çok hangi konularda soru soruldu?",
  "Aktivite yanıtlarını özetle.",
  "Bir sonraki eğitim için ne önerirsin?",
];
function ReportConversation({ report }: { report: ReportItem }) {
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
          aria-label={t("Rapor sohbeti")}
          aria-live="polite"
          aria-relevant="additions"
        >
          <div className="report-thread-inner">
            {turns.map((turn) => (
              <div className="report-turn" key={turn.id}>
                <div className="report-user-message">
                  <span className="sr-only">{t("Sen")}: </span>
                  {turn.question}
                </div>
                <div className="report-assistant-message">
                  <Icon name="sparkle" size={23} />
                  <div>
                    <span className="sr-only">{t("Rapor asistanı")}: </span>
                    <p>{turn.answer}</p>
                    {turn.sources.length > 0 && (
                      <div
                        className="report-chat-sources"
                        aria-label={t("Kaynaklar")}
                      >
                        {turn.sources.map((source) => (
                          <a
                            key={source.id}
                            href={`/?view=reports&report=${report.id}#report-${source.section}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Icon name="chart" size={14} />
                            {t(source.label)}
                            <Icon name="external" size={12} />
                          </a>
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
                  <Icon name="sparkle" size={23} />
                  <span>{t("Raporun inceleniyor…")}</span>
                  <Icon name="spinner" size={17} className="spin" />
                </div>
              </div>
            )}
            <div ref={bottom} />
          </div>
        </div>
      ) : (
        <div className="report-chat-welcome">
          <Icon name="sparkle" size={34} />
          <h2>{t("Bu raporu birlikte inceleyelim.")}</h2>
          <p>
            {t(
              "Soruların, katılımın ve aktivite yanıtlarının ardındaki detayları konuşabiliriz.",
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
                <Icon name="sparkle" size={17} />
                <span>{t(suggestion)}</span>
                <Icon name="arrow" size={15} />
              </button>
            ))}
          </div>
        )}
        <ErrorNote message={error || chat.error} />
        {!chat.data.aiReady && (
          <p className="small muted">
            {t("Rapor asistanını kullanmak için model bağlantısını ayarla.")}
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
            aria-label={t("Rapor hakkında sorunu yaz")}
            placeholder={t("Bu rapor hakkında bir şey sor…")}
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
            aria-label={t("Gönder")}
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
          {t("Yanıtlar yalnızca seçili raporun kayıtlarına dayanır.")}
        </p>
      </div>
    </div>
  );
}

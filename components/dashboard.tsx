"use client";
import { OperationProgress } from "./operation-progress";
import { ThemeMenu } from "./theme-menu";
import { ReportAssistantLink } from "./report-assistant-link";
import { Report } from "./training-report";
import { HomeUpdates } from "./home-updates";
import {
  CardListSkeleton,
  DashboardSkeleton,
  ParticipantListSkeleton,
  ReportTableSkeleton,
} from "./skeletons";
import { useLocale } from "./locale-provider";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { learningAccess } from "@/lib/training-access";
import type { Course, User } from "@/lib/types";
import { Landing } from "./landing";
import { HeaderActions } from "./header-actions";
import {
  Icon,
  Logo,
  Modal,
  ErrorNote,
  ResourceFailure,
  Empty,
  Status,
  api,
  useResource,
  date,
} from "./ui";

function TrainingCover({ course }: { course: Course }) {
  const { t } = useLocale();
  const [failed, setFailed] = useState(false);
  const coverPage = course.coverPage ?? course.pages[0]?.number;
  return (
    <div className="training-cover training-cover-preview">
      {coverPage && !failed ? (
        <img
          src={`/api/courses/${course.id}/page/${coverPage}`}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="training-cover-fallback">
          <Icon name="file" size={36} />
          <span>{t("Training materials")}</span>
        </div>
      )}
    </div>
  );
}

export function CreateTraining({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (course: Course) => void;
}) {
  const { t } = useLocale();

  const [file, setFile] = useState<File>(),
    [name, setName] = useState(""),
    [days, setDays] = useState(7),
    [auto, setAuto] = useState(true),
    [busy, setBusy] = useState(false),
    [dragging, setDragging] = useState(false),
    [error, setError] = useState("");
  function selectFile(selected?: File) {
    if (!selected) return;
    if (
      !/\.(pdf|pptx)$/i.test(selected.name) ||
      selected.size > 30 * 1024 * 1024
    ) {
      setError(t("Choose a PDF or PPTX file up to 30 MB."));
      return;
    }
    setError("");
    setFile(selected);
    setName(selected.name.replace(/\.[^.]+$/, ""));
  }
  async function create(demo = false) {
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      let body: FormData | object;
      if (demo) body = { demo: true, accessDays: days, autoAnswer: auto };
      else {
        if (!file) throw new Error(t("Choose your presentation file."));
        const form = new FormData();
        form.set("file", file);
        form.set("name", name);
        form.set("accessDays", String(days));
        form.set("autoAnswer", String(auto));
        body = form;
      }
      const result = await api("courses", body);
      onCreated(result.course);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      open={open}
      onClose={() => !busy && onClose()}
      closeDisabled={busy}
      title={t("Create new training")}
      description={t("Upload your presentation and set participant access.")}
    >
      {busy && <OperationProgress kind="training" />}
      <form
        hidden={busy}
        onSubmit={(e) => {
          e.preventDefault();
          void create();
        }}
      >
        <label
          className={`upload-zone ${file ? "has-file" : ""} ${dragging ? "is-dragging" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (!busy) selectFile(event.dataTransfer.files[0]);
          }}
        >
          <Icon name={file ? "file" : "upload"} size={32} />
          <strong>
            {file
              ? file.name
              : t("Drop your presentation here or choose a file")}
          </strong>
          <span>
            {file
              ? `${file.name.split(".").pop()?.toUpperCase()} · ${(file.size / 1024 / 1024).toFixed(1)} MB`
              : t("PDF or PPTX · Up to 30 MB · 80 slides")}
          </span>
          {file && (
            <span className="file-replace">{t("Choose a different file")}</span>
          )}
          <input
            type="file"
            accept=".pdf,.pptx"
            aria-label={t("Presentation file")}
            disabled={busy}
            onChange={(e) => {
              selectFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        <label>
          {t("Training name")}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("The file name is used automatically")}
            maxLength={120}
          />
        </label>
        <details className="training-access-settings">
          <summary>
            <span>
              <Icon name="agent" size={18} />
              {t("Learning agent settings")}
            </span>
            <span>
              {days} {t("days")}
            </span>
          </summary>
          <div>
            <label>
              {t("Learning agent access after training")}
              <div className="input-unit">
                <input
                  type="number"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  min={0}
                  max={365}
                  required
                />
                <span>{t("days")}</span>
              </div>
              <small>
                {t(
                  "Access starts when training ends. Choose 0 days to close it with the session.",
                )}
              </small>
            </label>
            <label className="toggle-field">
              <span>
                <strong>
                  {t("Automatic AI answers during live training")}
                </strong>
                <small>
                  {t(
                    "Questions are answered from your document. Unanswered questions are forwarded to you.",
                  )}
                </small>
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={auto}
                onChange={(e) => setAuto(e.target.checked)}
              />
            </label>
          </div>
        </details>
        <ErrorNote message={error} />
        <div className="modal-actions">
          <button
            type="button"
            className="text-button"
            disabled={busy}
            onClick={() => create(true)}
          >
            {t("Use sample presentation")}
          </button>
          <button className="button primary" disabled={busy}>
            <Icon name="plus" />
            {t("Create training")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function Dashboard() {
  const { t, locale } = useLocale();

  const router = useRouter();
  const auth = useResource<{ user?: User; aiReady: boolean; model: string }>(
    "auth",
  );
  const courses = useResource<{ courses: Course[] }>(
    `courses?account=${auth.data?.user?.id || ""}`,
    0,
    !!auth.data?.user,
  );
  const [view, setView] = useState("home"),
    [search, setSearch] = useState(""),
    [create, setCreate] = useState(false),
    [report, setReport] = useState(""),
    [mobile, setMobile] = useState(false);
  const mobileMenuTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!mobile) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobile(false);
        mobileMenuTrigger.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobile]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("view")) setView(params.get("view")!);
    if (params.get("report")) {
      setView("reports");
      setReport(params.get("report")!);
    }
  }, []);
  if (!auth.data)
    return auth.error ? (
      <ResourceFailure error={auth.error} onRetry={auth.refresh} />
    ) : (
      <DashboardSkeleton view={view} />
    );
  if (!auth.data.user) return <Landing />;
  const user = auth.data.user;
  if (user.role === "participant")
    return (
      <div className="participant-home">
        <header>
          <Logo />
          <ThemeMenu />
          <button
            className="text-button"
            onClick={async () => {
              await api("auth", undefined, "DELETE");
              await auth.refresh();
            }}
          >
            <Icon name="logout" />
            {t("Log out")}
          </button>
        </header>
        <div>
          <h1>
            {t("Hello,")} {user.name.split(" ")[0]}.
          </h1>
          <p className="muted">
            {t("Join with the code shared by your instructor.")}
          </p>
          <JoinForm />
          {!courses.data ? (
            courses.error ? (
              <ResourceFailure
                error={courses.error}
                onRetry={courses.refresh}
              />
            ) : (
              <ParticipantListSkeleton />
            )
          ) : (
            courses.data.courses.map((c) => (
              <button
                className="joined-course"
                key={c.id}
                onClick={() => router.push(`/join?training=${c.id}`)}
              >
                <Icon name="presentation" />
                <span>
                  {c.name}
                  <small>{date(c.createdAt, locale)}</small>
                </span>
                <Status status={c.status} />
                <Icon name="arrow" />
              </button>
            ))
          )}
        </div>
      </div>
    );
  const list = (courses.data?.courses || []).filter((c) =>
      c.name
        .toLocaleLowerCase("tr-TR")
        .includes(search.toLocaleLowerCase("tr-TR")),
    ),
    reports = list.filter((c) => c.status === "ended");
  function change(next: string) {
    setView(next);
    setReport("");
    setMobile(false);
    router.replace(`/?view=${next}`);
  }
  function openReport(id: string) {
    setView("reports");
    setReport(id);
    router.replace(`/?view=reports&report=${id}`);
  }
  return (
    <div className="app-shell">
      <header className="app-header">
        <button
          ref={mobileMenuTrigger}
          className="icon-button mobile-menu"
          aria-label={t("Open menu")}
          aria-expanded={mobile}
          aria-controls="workspace-navigation"
          onClick={() => setMobile(!mobile)}
        >
          <Icon name="menu" />
        </button>
        <Logo />
        <label className="header-search">
          <Icon name="search" />
          <input
            aria-label={t("Search training")}
            placeholder={t("Search your training…")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="icon-button"
              aria-label={t("Clear search")}
              onClick={() => setSearch("")}
            >
              <Icon name="close" size={16} />
            </button>
          )}
        </label>
        <HeaderActions
          user={user}
          courses={courses.data?.courses || []}
          onSettings={() => change("settings")}
          onReport={openReport}
          onLogout={async () => {
            await api("auth", undefined, "DELETE");
            await auth.refresh();
          }}
        />
      </header>
      <aside
        id="workspace-navigation"
        className={`sidebar ${mobile ? "open" : ""}`}
      >
        <nav>
          {[
            ["home", "home", t("Home")],
            ["courses", "folder", t("My training")],
            ["reports", "chart", t("Reports")],
          ].map(([v, icon, label]) => (
            <button
              key={v}
              className={view === v ? "active" : ""}
              aria-current={view === v ? "page" : undefined}
              onClick={() => change(v)}
            >
              <Icon name={icon as "home"} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button
            className={view === "settings" ? "active" : ""}
            onClick={() => change("settings")}
          >
            <Icon name="settings" />
            {t("Settings")}
          </button>
          <button
            onClick={async () => {
              await api("auth", undefined, "DELETE");
              await auth.refresh();
            }}
          >
            <Icon name="logout" />
            {t("Log out")}
          </button>
        </div>
      </aside>
      <main className="dashboard-main">
        {view === "settings" ? (
          <>
            <div className="page-title">
              <div>
                <h1>{t("Settings")}</h1>
                <p className="muted">
                  {t("Your profile, preferences and agent availability.")}
                </p>
              </div>
            </div>
            <section className="settings-section">
              <h2>{t("Account")}</h2>
              <dl>
                <dt>{t("Full name")}</dt>
                <dd>{user.name}</dd>
                <dt>{t("Account type")}</dt>
                <dd>{t("Instructor")}</dd>
                <dt>{t("Email")}</dt>
                <dd>{user.email || t("Experience account")}</dd>
              </dl>
              <h2>{t("Agent availability")}</h2>
              <p className={auth.data.aiReady ? "success-text" : "muted"}>
                <Icon name={auth.data.aiReady ? "success" : "warning"} />
                {auth.data.aiReady
                  ? t("Your AI agents are available")
                  : t("Your AI agents are not available yet")}
              </p>
              <p className="muted">
                {t(
                  "Your learning, practice and report agents use your training context.",
                )}
              </p>
              <details className="technical-details">
                <summary>{t("Technical details")}</summary>
                <code>{auth.data.model}</code>
              </details>
            </section>
          </>
        ) : view === "reports" ? (
          report ? (
            <Report id={report} onBack={() => change("reports")} />
          ) : (
            <>
              <div className="page-title">
                <div>
                  <h1>{t("Reports")}</h1>
                  <p className="muted">
                    {t(
                      "Questions and activity results from your completed training.",
                    )}
                  </p>
                </div>
                <ReportAssistantLink />
              </div>
              {!courses.data ? (
                courses.error ? (
                  <ResourceFailure
                    error={courses.error}
                    onRetry={courses.refresh}
                  />
                ) : (
                  <ReportTableSkeleton />
                )
              ) : reports.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>{t("Training")}</th>
                        <th>{t("Completed")}</th>
                        <th>{t("Learning agent access")}</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((c) => (
                        <tr key={c.id} onClick={() => openReport(c.id)}>
                          <td>
                            <button
                              className="table-link"
                              onClick={() => openReport(c.id)}
                            >
                              {c.name}
                            </button>
                          </td>
                          <td>{c.endedAt && date(c.endedAt, locale)}</td>
                          <td>
                            {learningAccess(c).canAsk
                              ? t("{days} days remaining", {
                                  days: learningAccess(c).remainingDays,
                                })
                              : t("Access ended")}
                          </td>
                          <td>
                            <Icon name="arrow" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty
                  icon="chart"
                  title={t("Your first report will appear after training ends")}
                  description={t(
                    "Questions, AI answers and activities are brought together automatically.",
                  )}
                />
              )}
            </>
          )
        ) : (
          <div
            className={view === "home" ? "dashboard-home-layout" : undefined}
          >
            <div className="dashboard-home-content">
              <div className="page-title">
                <div>
                  <h1>
                    {view === "home" ? (
                      <>
                        {t("Hello,")} <span>{user.name.split(" ")[0]}.</span>
                      </>
                    ) : (
                      t("My training")
                    )}
                  </h1>
                  <p className="muted">
                    {view === "home"
                      ? t("Start your next training here.")
                      : t(
                          "Prepare your presentations, practice and start your training.",
                        )}
                  </p>
                </div>
              </div>
              <div className="page-actions">
                <button
                  className="button primary"
                  onClick={() => setCreate(true)}
                >
                  <Icon name="plus" />
                  {t("New training")}
                </button>
              </div>
              {courses.data && courses.error && (
                <ErrorNote message={courses.error} />
              )}
              <section className="training-section">
                <div className="section-title">
                  <h2>
                    {search
                      ? t("Search results")
                      : view === "home"
                        ? t("Recent training")
                        : t("All training")}
                  </h2>
                  {view === "home" && (
                    <button
                      className="text-button"
                      onClick={() => change("courses")}
                    >
                      {t("View all")}
                      <Icon name="right" />
                    </button>
                  )}
                </div>
                {!courses.data ? (
                  courses.error ? (
                    <ResourceFailure
                      error={courses.error}
                      onRetry={courses.refresh}
                    />
                  ) : (
                    <CardListSkeleton />
                  )
                ) : list.length ? (
                  <div className="training-grid">
                    {list.slice(0, view === "home" ? 6 : undefined).map((c) => (
                      <button
                        className="training-card"
                        key={c.id}
                        onClick={() =>
                          c.status === "ended"
                            ? openReport(c.id)
                            : router.push(
                                `/training/${c.id}${c.status === "live" ? "/live" : ""}`,
                              )
                        }
                      >
                        <TrainingCover course={c} />
                        <div className="training-card-content">
                          <Status status={c.status} />
                          <h3>{c.name}</h3>
                          <div className="card-meta">
                            <span>{date(c.createdAt, locale)}</span>
                          </div>
                          <div className="training-card-next">
                            <span>
                              {t(
                                c.status === "ended"
                                  ? "View learning report"
                                  : c.status === "live"
                                    ? "Return to live training"
                                    : "Continue preparing",
                              )}
                            </span>
                            <Icon name="arrow" size={17} />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <Empty
                    title={
                      search
                        ? t("No matching training found")
                        : t("Create your first training")
                    }
                    description={
                      search
                        ? t("Try searching for another name.")
                        : t(
                            "Upload your presentation. Activities and voice practice await in your training workspace.",
                          )
                    }
                  >
                    {!search && (
                      <button
                        className="button"
                        onClick={() => setCreate(true)}
                      >
                        <Icon name="plus" />
                        {t("Create training")}
                      </button>
                    )}
                  </Empty>
                )}
              </section>
              {view === "home" && courses.data?.courses.length === 0 && (
                <section className="home-guide">
                  <div>
                    <span className="guide-number">01</span>
                    <h3>{t("Upload your presentation")}</h3>
                    <p>
                      {t("Make your document the source of your training.")}
                    </p>
                  </div>
                  <div>
                    <span className="guide-number">02</span>
                    <h3>{t("Prepare your flow")}</h3>
                    <p>
                      {t("Add activities and practice with your audience.")}
                    </p>
                  </div>
                  <div>
                    <span className="guide-number">03</span>
                    <h3>{t("Learn together")}</h3>
                    <p>
                      {t(
                        "Start your training and follow the questions and answers.",
                      )}
                    </p>
                  </div>
                </section>
              )}
            </div>
            {view === "home" && (
              <HomeUpdates
                hasDraft={
                  !!courses.data?.courses.some(
                    (course) => course.status === "draft",
                  )
                }
                onExplore={(feature) => {
                  if (feature === "reports") {
                    change("reports");
                    return;
                  }
                  const course = courses.data?.courses.find(
                    (course) => course.status === "draft",
                  );
                  if (!course) {
                    setCreate(true);
                    return;
                  }
                  router.push(
                    `/training/${course.id}${feature === "practice" ? "/practice" : ""}`,
                  );
                }}
              />
            )}
          </div>
        )}
      </main>
      <CreateTraining
        open={create}
        onClose={() => setCreate(false)}
        onCreated={(c) => router.push(`/training/${c.id}`)}
      />
    </div>
  );
}
export function JoinForm({
  onJoin,
  initialCode = "",
}: {
  onJoin?: (id: string) => void;
  initialCode?: string;
}) {
  const { t } = useLocale();

  const router = useRouter(),
    [code, setCode] = useState(initialCode),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="join-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          const result = await api("join", { code });
          onJoin
            ? onJoin(result.id)
            : router.push(`/join?training=${result.id}`);
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        {t("Training code")}
        <input
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          inputMode="numeric"
          placeholder={t("6-digit code")}
          minLength={6}
          maxLength={6}
          required
        />
      </label>
      <button className="button primary" disabled={busy}>
        {t("Join training")}
        <Icon name="arrow" />
      </button>
      <ErrorNote message={error} />
    </form>
  );
}

"use client";
import { OperationProgress } from "./operation-progress";
import { ThemeMenu } from "./theme-menu";
import { ReportAssistantLink } from "./report-assistant-link";
import { Report } from "./training-report";
import { HomeUpdates } from "./home-updates";
import { AccountSettings, WorkspaceHelp } from "./account-settings";
import { DateFilter, GroupManager, TrainingCardMenu } from "./library-controls";
import { ALL_TIME, withinLibraryPeriod } from "@/lib/library-filters";
import type { TrainingGroup } from "@/lib/workspace-library";
import {
  trainingFamily,
  visibleTrainingSessions,
} from "@/lib/training-sessions";
import {
  CardListSkeleton,
  DashboardSkeleton,
  ParticipantListSkeleton,
  ReportTableSkeleton,
} from "./skeletons";
import { useLocale } from "./locale-provider";
import { Fragment, useEffect, useRef, useState } from "react";
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
  dateTime,
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
    5000,
    !!auth.data?.user,
  );
  const groups = useResource<{ groups: TrainingGroup[] }>(
    "groups",
    0,
    auth.data?.user?.role === "teacher",
  );
  const [accountOpen, setAccountOpen] = useState(false),
    [helpOpen, setHelpOpen] = useState(false),
    [groupOpen, setGroupOpen] = useState(false),
    [waitlistRequest, setWaitlistRequest] = useState(0),
    [groupFilter, setGroupFilter] = useState("all");
  const [trainingPeriod, setTrainingPeriod] = useState(ALL_TIME),
    [reportPeriod, setReportPeriod] = useState(ALL_TIME);
  const settingsTrigger = useRef<HTMLElement | null>(null),
    helpTrigger = useRef<HTMLElement | null>(null),
    groupTrigger = useRef<HTMLElement | null>(null);
  function openSettings(trigger?: HTMLElement) {
    settingsTrigger.current =
      trigger || (document.activeElement as HTMLElement);
    setAccountOpen(true);
  }
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
    if (params.get("view") === "settings") {
      setAccountOpen(true);
      setView("home");
    } else if (params.get("view")) setView(params.get("view")!);
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
  const list = (courses.data?.courses || []).filter(
      (c) =>
        !c.trashedAt &&
        c.name
          .toLocaleLowerCase(locale)
          .includes(search.toLocaleLowerCase(locale)),
    ),
    reports = list
      .filter(
        (c) =>
          c.status === "ended" && withinLibraryPeriod(c.endedAt, reportPeriod),
      )
      .sort((a, b) =>
        (b.endedAt || b.createdAt).localeCompare(a.endedAt || a.createdAt),
      ),
    trainingList = visibleTrainingSessions(list)
      .filter(
        (course) =>
          view !== "courses" ||
          (withinLibraryPeriod(
            course.startedAt || course.createdAt,
            trainingPeriod,
          ) &&
            (groupFilter === "all" ||
              (groupFilter === "ungrouped"
                ? !course.groupId
                : course.groupId === groupFilter))),
      )
      .sort((a, b) =>
        view === "courses" && groupFilter === "all"
          ? (a.groupId || "").localeCompare(b.groupId || "") ||
            b.createdAt.localeCompare(a.createdAt)
          : b.createdAt.localeCompare(a.createdAt),
      );
  const hasTrainingFilters =
    !!search ||
    (view === "courses" &&
      (groupFilter !== "all" || trainingPeriod.period !== "all"));
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
          onSettings={openSettings}
          waitlistRequest={waitlistRequest}
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
        <div className="sidebar-integrations" aria-label={t("Integrations")}>
          <span>{t("Integrations")}</span>
          <div>
            {[
              ["Google Meet", "/integrations/google-meet.svg"],
              ["Microsoft Teams", "/integrations/teams.svg"],
              ["Zoom", "/integrations/zoom.png"],
              ["PowerPoint", "/integrations/powerpoint.svg"],
              ["Google Slides", "/integrations/google-slides.svg"],
            ].map(([name, src]) => (
              <button
                type="button"
                key={name}
                aria-label={t("Join the waitlist for {name}", { name })}
                title={name}
                onClick={() => setWaitlistRequest((current) => current + 1)}
              >
                <img src={src} alt="" width={26} height={26} />
              </button>
            ))}
          </div>
        </div>
        <div className="sidebar-bottom">
          <button onClick={(event) => openSettings(event.currentTarget)}>
            <Icon name="settings" />
            {t("Settings")}
          </button>
          <button
            className={view === "trash" ? "active" : ""}
            onClick={() => change("trash")}
          >
            <Icon name="trash" />
            {t("Trash")}
          </button>
          <button
            onClick={(event) => {
              helpTrigger.current = event.currentTarget;
              setHelpOpen(true);
            }}
          >
            <Icon name="help" />
            {t("Help")}
          </button>
        </div>
      </aside>
      <main className="dashboard-main">
        {view === "trash" ? (
          <TrainingTrash
            courses={courses.data?.courses}
            error={courses.error}
            onChanged={courses.refresh}
          />
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
              <div className="library-toolbar">
                <DateFilter value={reportPeriod} onChange={setReportPeriod} />
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
                        <th>{t("Started")}</th>
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
                              <small className="report-session-label">
                                {t("Session {number}", {
                                  number: c.sessionNumber || 1,
                                })}
                              </small>
                            </button>
                          </td>
                          <td>
                            {c.startedAt ? dateTime(c.startedAt, locale) : "—"}
                          </td>
                          <td>{c.endedAt && dateTime(c.endedAt, locale)}</td>
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
                  title={t(
                    search || reportPeriod.period !== "all"
                      ? "No reports match your filters"
                      : "Your first report will appear after training ends",
                  )}
                  description={t(
                    search || reportPeriod.period !== "all"
                      ? "Adjust the search or date range to find a session."
                      : "Questions, AI answers and activities are brought together automatically.",
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
              {view === "courses" && (
                <div className="library-toolbar">
                  <label className="library-group-filter">
                    <span className="sr-only">{t("Training group")}</span>
                    <select
                      aria-label={t("Training group")}
                      value={groupFilter}
                      onChange={(event) => setGroupFilter(event.target.value)}
                    >
                      <option value="all">{t("All groups")}</option>
                      <option value="ungrouped">{t("Ungrouped")}</option>
                      {groups.data?.groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <DateFilter
                    value={trainingPeriod}
                    onChange={setTrainingPeriod}
                  />
                  <button
                    className="button library-manage-groups"
                    onClick={(event) => {
                      groupTrigger.current = event.currentTarget;
                      setGroupOpen(true);
                    }}
                  >
                    {t("Manage groups")}
                  </button>
                  <ErrorNote message={groups.error} />
                </div>
              )}
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
                ) : trainingList.length ? (
                  <div className="training-grid">
                    {trainingList
                      .slice(0, view === "home" ? 6 : undefined)
                      .map((c, cardIndex) => (
                        <Fragment key={c.id}>
                          {view === "courses" &&
                            groupFilter === "all" &&
                            !!groups.data?.groups.length &&
                            (cardIndex === 0 ||
                              trainingList[cardIndex - 1].groupId !==
                                c.groupId) && (
                              <div className="library-group-heading">
                                <h3>
                                  {groups.data.groups.find(
                                    (group) => group.id === c.groupId,
                                  )?.name || t("Ungrouped")}
                                </h3>
                              </div>
                            )}
                          <article className="training-card" key={c.id}>
                            <button
                              className="training-card-open"
                              onClick={() =>
                                router.push(
                                  `/training/${c.id}${c.status === "live" ? "/live" : ""}`,
                                )
                              }
                            >
                              <TrainingCover course={c} />
                              <div className="training-card-content">
                                <Status status={c.status} />
                                <h3>{c.name}</h3>
                                <div className="card-meta">
                                  <span>
                                    {t("Session {number}", {
                                      number: c.sessionNumber || 1,
                                    })}{" "}
                                    ·{" "}
                                    {dateTime(
                                      c.startedAt || c.createdAt,
                                      locale,
                                    )}
                                    {c.groupId && (
                                      <small>
                                        {
                                          groups.data?.groups.find(
                                            (group) => group.id === c.groupId,
                                          )?.name
                                        }
                                      </small>
                                    )}
                                  </span>
                                </div>
                                <div className="training-card-next">
                                  <span>
                                    {t(
                                      c.status === "ended"
                                        ? "Prepare another session"
                                        : c.status === "live"
                                          ? "Return to live training"
                                          : "Continue preparing",
                                    )}
                                  </span>
                                  <Icon name="arrow" size={17} />
                                </div>
                              </div>
                            </button>
                            <TrainingCardMenu
                              course={c}
                              groups={groups.data?.groups || []}
                              onChanged={courses.refresh}
                            />
                          </article>
                        </Fragment>
                      ))}
                  </div>
                ) : (
                  <Empty
                    title={
                      hasTrainingFilters
                        ? t("No matching training found")
                        : t("Create your first training")
                    }
                    description={
                      hasTrainingFilters
                        ? t("Adjust your search, group or date filters.")
                        : t(
                            "Upload your presentation. Activities and voice practice await in your training workspace.",
                          )
                    }
                  >
                    {!hasTrainingFilters && (
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
                    (course) => course.status === "draft" && !course.trashedAt,
                  )
                }
                onExplore={(feature) => {
                  if (feature === "reports") {
                    change("reports");
                    return;
                  }
                  const course = courses.data?.courses.find(
                    (course) => course.status === "draft" && !course.trashedAt,
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
      <AccountSettings
        open={accountOpen}
        user={user}
        onClose={() => setAccountOpen(false)}
        onSaved={auth.refresh}
        onWaitlist={() => setWaitlistRequest((current) => current + 1)}
        returnFocusRef={settingsTrigger}
      />
      <WorkspaceHelp
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        onTraining={() => change("courses")}
        onReports={() => change("reports")}
        returnFocusRef={helpTrigger}
      />
      <GroupManager
        open={groupOpen}
        onClose={() => setGroupOpen(false)}
        groups={groups.data?.groups || []}
        returnFocusRef={groupTrigger}
        onChanged={async () => {
          await Promise.all([groups.refresh(), courses.refresh()]);
          setGroupFilter("all");
        }}
      />

      <CreateTraining
        open={create}
        onClose={() => setCreate(false)}
        onCreated={(c) => router.push(`/training/${c.id}`)}
      />
    </div>
  );
}
function TrainingTrash({
  courses,
  error: loadError,
  onChanged,
}: {
  courses?: Course[];
  error?: string;
  onChanged: () => Promise<unknown>;
}) {
  const { t, locale } = useLocale();
  const [busy, setBusy] = useState(""),
    [error, setError] = useState("");
  const list = visibleTrainingSessions(
    (courses || []).filter((course) => course.trashedAt),
  ).filter(
    (course, index, items) =>
      items.findIndex(
        (item) => trainingFamily(item) === trainingFamily(course),
      ) === index,
  );
  if (!courses)
    return loadError ? (
      <ResourceFailure error={loadError} onRetry={onChanged} />
    ) : (
      <CardListSkeleton />
    );
  return (
    <section>
      <div className="page-title">
        <div>
          <h1>{t("Trash")}</h1>
          <p className="muted">
            {t(
              "Your training and its session records stay here until you restore them.",
            )}
          </p>
        </div>
      </div>
      <ErrorNote message={error} />
      {list.length ? (
        <div className="trash-list">
          {list.map((course) => (
            <div key={course.id}>
              <div>
                <strong>{course.name}</strong>
                <span>
                  {course.trashedAt && dateTime(course.trashedAt, locale)}
                </span>
              </div>
              <button
                className="button"
                disabled={!!busy}
                onClick={async () => {
                  setBusy(course.id);
                  setError("");
                  try {
                    await api(`courses/${course.id}/restore`, {});
                    await onChanged();
                  } catch (error) {
                    setError((error as Error).message);
                  } finally {
                    setBusy("");
                  }
                }}
              >
                {t(busy === course.id ? "Restoring…" : "Restore")}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          icon="trash"
          title={t("Trash is empty")}
          description={t("Training moved to Trash will appear here.")}
        />
      )}
    </section>
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

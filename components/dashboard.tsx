"use client";
import { clientResources } from "@/lib/client-resource-cache";
import { RouteProgress, useWorkspaceNavigation } from "./route-progress";
import { slideSource } from "@/lib/slide-source";
import { AccessDurationSelect } from "./access-duration-select";
import { useTimeGreeting } from "./use-time-greeting";
import { ProductSelect } from "./product-select";
import { OperationProgress } from "./operation-progress";
import { ThemeMenu } from "./theme-menu";
import { ReportAssistantLink } from "./report-assistant-link";
import { useLibraryContext } from "./use-library-context";
import type { TeamState } from "@/lib/teams";
import {
  TeamWorkspace,
  CreateTeamDialog,
  InviteTeamDialog,
  MemberAvatar,
} from "./team-workspace";
import { SessionReports } from "./session-reports";
import { TrainingPicker } from "./training-picker";
import { ResponsiveSidebar } from "./responsive-sidebar";
import { Report } from "./training-report";
import { HomeUpdates } from "./home-updates";
import { AccountSettings, WorkspaceHelp } from "./account-settings";
import {
  DateFilter,
  GroupManager,
  TrainingCardMenu,
  TrainingGroups,
} from "./library-controls";
import { ALL_TIME, withinLibraryPeriod } from "@/lib/library-filters";
import type { TrainingGroup } from "@/lib/workspace-library";
import {
  trainingFamily,
  trainingCollections,
  visibleTrainingSessions,
} from "@/lib/training-sessions";
import {
  CardListSkeleton,
  DashboardSkeleton,
  ParticipantListSkeleton,
  ReportTableSkeleton,
} from "./skeletons";
import { useProductLocale as useLocale } from "./product-locale";
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
          src={slideSource(course, coverPage)}
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
  folders = [],
  initialFolderId = "",
  onFoldersChanged,
  returnFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (course: Course) => void;
  folders?: TrainingGroup[];
  initialFolderId?: string;
  onFoldersChanged?: () => Promise<unknown>;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}) {
  const { t } = useLocale();

  const [file, setFile] = useState<File>(),
    [folderId, setFolderId] = useState(initialFolderId),
    [name, setName] = useState(""),
    [days, setDays] = useState(7),
    [auto, setAuto] = useState(true),
    [busy, setBusy] = useState(false),
    [dragging, setDragging] = useState(false),
    [error, setError] = useState("");
  const [addedFolders, setAddedFolders] = useState<TrainingGroup[]>([]);
  const [creatingFolder, setCreatingFolder] = useState(false),
    [folderName, setFolderName] = useState(""),
    [folderBusy, setFolderBusy] = useState(false);
  const folderChoices = [
    ...folders,
    ...addedFolders.filter((item) => !folders.some((f) => f.id === item.id)),
  ];
  const [discard, setDiscard] = useState(false);
  const keepEditing = useRef<HTMLButtonElement>(null);
  const trainingName = useRef<HTMLInputElement>(null);
  const wasDiscarding = useRef(false);
  useEffect(() => {
    if (discard) keepEditing.current?.focus();
    else if (wasDiscarding.current) trainingName.current?.focus();
    wasDiscarding.current = discard;
  }, [discard]);
  async function createFolder() {
    if (folderBusy || !folderName.trim()) return;
    setFolderBusy(true);
    setError("");
    try {
      const result = await api<{ group: TrainingGroup }>("groups", {
        name: folderName,
      });
      setAddedFolders((prior) => [...prior, result.group]);
      setFolderId(result.group.id);
      setCreatingFolder(false);
      setFolderName("");
      await onFoldersChanged?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setFolderBusy(false);
    }
  }
  function requestClose() {
    if (busy || folderBusy) return;
    if (
      file ||
      name.trim() ||
      days !== 7 ||
      !auto ||
      folderId !== initialFolderId
    )
      setDiscard(true);
    else onClose();
  }
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
    setName((previous) =>
      !previous || previous === file?.name.replace(/\.[^.]+$/, "")
        ? selected.name.replace(/\.[^.]+$/, "")
        : previous,
    );
    setFile(selected);
  }
  async function create(demo = false) {
    if (busy || folderBusy) return;
    setError("");
    setBusy(true);
    try {
      let body: FormData | object;
      if (demo)
        body = {
          demo: true,
          name,
          folderId,
          accessDays: days,
          autoAnswer: auto,
        };
      else {
        if (!file) throw new Error(t("Choose your presentation file."));
        const upload = await api<{
          direct: boolean;
          uploadId?: string;
          signedUrl?: string;
        }>("uploads", { name: file.name, size: file.size });
        if (upload.direct && upload.signedUrl && upload.uploadId) {
          const transferred = await fetch(upload.signedUrl, {
            method: "PUT",
            headers: {
              "Content-Type": file.type || "application/octet-stream",
            },
            body: file,
          });
          if (!transferred.ok)
            throw new Error(
              t("The file could not be uploaded. Please try again."),
            );
          body = {
            uploadId: upload.uploadId,
            name,
            accessDays: days,
            autoAnswer: auto,
            folderId,
          };
        } else {
          const form = new FormData();
          form.set("file", file);
          form.set("name", name);
          form.set("accessDays", String(days));
          form.set("autoAnswer", String(auto));
          form.set("folderId", folderId);
          body = form;
        }
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
      onClose={requestClose}
      closeDisabled={busy}
      title={t("Create new training")}
      description={t("Upload your presentation and set participant access.")}
      returnFocusRef={returnFocusRef}
      className="create-training-modal"
    >
      {busy && <OperationProgress kind="training" />}
      {discard && !busy && (
        <div className="creation-discard" role="alert">
          <strong>{t("Discard this training setup?")}</strong>
          <p>
            {t(
              "Your file has not been uploaded. Keep editing or discard this setup.",
            )}
          </p>
          <div className="modal-actions">
            <button
              className="button"
              ref={keepEditing}
              onClick={() => setDiscard(false)}
            >
              {t("Keep editing")}
            </button>
            <button className="button danger" onClick={onClose}>
              {t("Discard changes")}
            </button>
          </div>
        </div>
      )}
      <form
        hidden={busy || discard}
        onSubmit={(e) => {
          e.preventDefault();
          void create();
        }}
      >
        <div className="create-training-fields">
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
              <span className="file-replace">
                {t("Choose a different file")}
              </span>
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
              ref={trainingName}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("The file name is used automatically")}
              maxLength={120}
            />
          </label>
          <label>
            {t("Folder")}
            <ProductSelect
              label={t("Folder")}
              value={folderId}
              onChange={setFolderId}
              disabled={busy || folderBusy}
              options={[
                { value: "", label: t("All presentations") },
                ...folderChoices.map((f) => ({ value: f.id, label: f.name })),
              ]}
              action={{
                label: t("Create new folder"),
                onSelect: () => setCreatingFolder(true),
              }}
            />
          </label>
          {creatingFolder && (
            <div className="create-folder-inline">
              <label>
                {t("Folder name")}
                <input
                  autoFocus
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  maxLength={60}
                  disabled={folderBusy}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void createFolder();
                    }
                  }}
                />
              </label>
              <button
                type="button"
                className="button"
                disabled={folderBusy || !folderName.trim()}
                onClick={createFolder}
              >
                {t("Create folder")}
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label={t("Cancel")}
                disabled={folderBusy}
                onClick={() => setCreatingFolder(false)}
              >
                <Icon name="close" />
              </button>
            </div>
          )}
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
              <AccessDurationSelect
                value={days}
                onChange={setDays}
                disabled={busy}
              />
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
        </div>
        <div className="modal-actions">
          <button
            type="button"
            className="text-button"
            disabled={busy}
            onClick={() => create(true)}
          >
            {t("Use sample presentation")}
          </button>
          <button
            className="button primary"
            disabled={busy || folderBusy || !file}
          >
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
  const greeting = useTimeGreeting();

  const router = useRouter();
  const { pending: navigating, navigate } = useWorkspaceNavigation();
  function preparePresentation(course: Course) {
    router.prefetch(
      `/training/${course.id}${course.status === "live" ? "/live" : ""}`,
    );
    if (course.status === "draft")
      void clientResources
        .read(`courses/${course.id}`, () => api(`courses/${course.id}`))
        .catch(() => {});
  }

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
  const [view, setView] = useState("home");
  const team = useResource<TeamState>(
    `team?account=${auth.data?.user?.id || ""}`,
    10000,
    auth.data?.user?.role === "teacher",
  );
  const [createTeamOpen, setCreateTeamOpen] = useState(false),
    [inviteTeamOpen, setInviteTeamOpen] = useState(false);
  const teamTrigger = useRef<HTMLElement | null>(null);
  async function refreshTeam() {
    await Promise.all([team.refresh(), courses.refresh()]);
  }
  function inviteTeam(trigger: HTMLElement) {
    setMobile(false);
    teamTrigger.current = trigger;
    if (team.data?.team) setInviteTeamOpen(true);
    else setCreateTeamOpen(true);
  }
  const [accountOpen, setAccountOpen] = useState(false),
    [helpOpen, setHelpOpen] = useState(false),
    [groupOpen, setGroupOpen] = useState(false),
    [waitlistRequest, setWaitlistRequest] = useState(0);
  const {
    search,
    setSearch,
    groupFilter,
    setGroupFilter,
    trainingPeriod,
    setTrainingPeriod,
    reportPeriod,
    setReportPeriod,
  } = useLibraryContext(auth.data?.user?.id);
  useEffect(() => {
    if (groupFilter === "ungrouped") setGroupFilter("all");
  }, [groupFilter, setGroupFilter]);
  const [featurePicker, setFeaturePicker] = useState<
    "practice" | "activities" | null
  >(null);
  const [createDestination, setCreateDestination] = useState<
    "practice" | "activities" | null
  >(null);
  const featureTrigger = useRef<HTMLElement | null>(null);
  const activeGroup = useRef<HTMLButtonElement>(null),
    newTrainingTrigger = useRef<HTMLButtonElement>(null);
  const [libraryNotice, setLibraryNotice] = useState<{
    message: string;
    groupId?: string;
    trash?: boolean;
  } | null>(null);
  const settingsTrigger = useRef<HTMLElement | null>(null),
    helpTrigger = useRef<HTMLElement | null>(null),
    groupTrigger = useRef<HTMLElement | null>(null);
  function openSettings(trigger?: HTMLElement) {
    setMobile(false);
    settingsTrigger.current = mobile
      ? mobileMenuTrigger.current
      : trigger || (document.activeElement as HTMLElement);
    setAccountOpen(true);
  }
  const [create, setCreate] = useState(false),
    [report, setReport] = useState(""),
    [mobile, setMobile] = useState(false);
  const mobileMenuTrigger = useRef<HTMLButtonElement>(null);
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
            {t(greeting)}, {user.name.split(" ")[0]}.
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
                onClick={() => navigate(`/join?training=${c.id}`)}
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
    allCollections = trainingCollections(
      (courses.data?.courses || []).filter(
        (course) => !course.trashedAt && !course.sharedReport,
      ),
    ),
    trainingList = trainingCollections(
      list
        .filter((course) => !course.sharedReport)
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
        ),
    )
      .map((collection) => collection.current)
      .sort((a, b) =>
        view === "courses" && groupFilter === "all"
          ? (a.groupId || "").localeCompare(b.groupId || "") ||
            b.createdAt.localeCompare(a.createdAt)
          : b.createdAt.localeCompare(a.createdAt),
      );
  const groupCounts: Record<string, number> = { all: 0, ungrouped: 0 };
  for (const { current: course } of allCollections) {
    groupCounts.all++;
    const key = course.groupId || "ungrouped";
    groupCounts[key] = (groupCounts[key] || 0) + 1;
  }
  const emptyGroup =
    view === "courses" &&
    groupFilter !== "all" &&
    !search &&
    trainingPeriod.period === "all" &&
    !groupCounts[groupFilter];
  const hasTrainingFilters =
    !!search ||
    (view === "courses" &&
      (groupFilter !== "all" || trainingPeriod.period !== "all"));
  const drafts = (courses.data?.courses || [])
    .filter((course) => course.status === "draft" && !course.trashedAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const destinationFolder =
    view === "courses"
      ? groups.data?.groups.find((folder) => folder.id === groupFilter)?.id ||
        ""
      : "";
  function openCreation(
    trigger: HTMLElement,
    feature: "practice" | "activities" | null = null,
  ) {
    featureTrigger.current = trigger;
    setCreateDestination(feature);
    setCreate(true);
  }
  function change(next: string) {
    setLibraryNotice(null);
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
      <RouteProgress pending={navigating} />
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
            aria-label={t("Search presentations")}
            placeholder={t("Search your presentations…")}
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
      <ResponsiveSidebar
        open={mobile}
        onOpenChange={setMobile}
        returnFocusRef={mobileMenuTrigger}
        label={t("Workspace navigation")}
        restoreFocus={!accountOpen && !helpOpen}
        overlayClassName="workspace-nav-overlay"
        id="workspace-navigation"
        className={`sidebar ${mobile ? "open" : ""}`}
      >
        <button
          className="icon-button workspace-sidebar-close"
          aria-label={t("Close menu")}
          onClick={() => setMobile(false)}
        >
          <Icon name="close" />
        </button>
        <nav>
          {[
            ["home", "home", t("Home")],
            ["courses", "folder", t("My presentations")],
            ["reports", "chart", t("Reports")],
            ["team", "users", t(team.data?.team ? "My team" : "Create team")],
          ].map(([v, icon, label]) => (
            <button
              key={v}
              className={view === v ? "active" : ""}
              aria-current={view === v ? "page" : undefined}
              disabled={v === "team" && !team.data && !team.error}
              onClick={(event) => {
                if (v === "team" && !team.data?.team && !team.error)
                  inviteTeam(event.currentTarget);
                else change(v);
              }}
            >
              <Icon name={icon as "home"} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-integrations" aria-label={t("Integrations")}>
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
                onClick={() => {
                  setMobile(false);
                  setWaitlistRequest((current) => current + 1);
                }}
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
              helpTrigger.current = mobile
                ? mobileMenuTrigger.current
                : event.currentTarget;
              setMobile(false);
              setHelpOpen(true);
            }}
          >
            <Icon name="help" />
            {t("Help")}
          </button>
        </div>
      </ResponsiveSidebar>
      <main className={`dashboard-main dashboard-view-${view}`}>
        {view === "team" ? (
          <TeamWorkspace
            key={team.data?.team?.id || "none"}
            data={team.data}
            error={team.error}
            user={user}
            onChanged={refreshTeam}
            onCreate={inviteTeam}
            onInvite={inviteTeam}
            onReport={openReport}
          />
        ) : view === "trash" ? (
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
                      "Understand your audience and find the next step for each presentation.",
                    )}
                  </p>
                </div>
                <ReportAssistantLink />
              </div>
              <div className="library-toolbar report-library-toolbar">
                <button
                  data-inactive={
                    (!search && reportPeriod.period === "all") || undefined
                  }
                  disabled={!search && reportPeriod.period === "all"}
                  aria-hidden={!search && reportPeriod.period === "all"}
                  className="text-button library-clear"
                  onClick={() => {
                    setSearch("");
                    setReportPeriod(ALL_TIME);
                  }}
                >
                  {t("Clear filters")}
                </button>
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
                <SessionReports courses={reports} onOpen={openReport} />
              ) : (
                <Empty
                  icon="chart"
                  illustration={
                    search || reportPeriod.period !== "all" ? false : "reports"
                  }
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
                >
                  <button
                    className={
                      search || reportPeriod.period !== "all"
                        ? "button"
                        : "button primary"
                    }
                    onClick={() => {
                      if (search || reportPeriod.period !== "all") {
                        setSearch("");
                        setReportPeriod(ALL_TIME);
                      } else change("courses");
                    }}
                  >
                    {t(
                      search || reportPeriod.period !== "all"
                        ? "Clear filters"
                        : "Open my presentations",
                    )}
                  </button>
                </Empty>
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
                        {t(greeting)}, <span>{user.name.split(" ")[0]}.</span>
                      </>
                    ) : (
                      t("My presentations")
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
              <div
                className={`page-actions ${view === "courses" ? "library-actions" : ""}`}
              >
                <button
                  ref={newTrainingTrigger}
                  className="button primary"
                  onClick={(event) => openCreation(event.currentTarget)}
                >
                  <Icon name="plus" />
                  {t("New training")}
                </button>
                {view === "courses" && (
                  <div className="library-toolbar">
                    <button
                      data-inactive={!hasTrainingFilters || undefined}
                      disabled={!hasTrainingFilters}
                      aria-hidden={!hasTrainingFilters}
                      className="text-button library-clear"
                      onClick={() => {
                        setSearch("");
                        setGroupFilter("all");
                        setTrainingPeriod(ALL_TIME);
                      }}
                    >
                      {t("Clear filters")}
                    </button>
                    <DateFilter
                      value={trainingPeriod}
                      onChange={setTrainingPeriod}
                    />
                  </div>
                )}
              </div>
              {view === "courses" && (
                <>
                  <TrainingGroups
                    groups={groups.data?.groups || []}
                    activeRef={activeGroup}
                    counts={groupCounts}
                    loading={!courses.data}
                    value={groupFilter}
                    onChange={setGroupFilter}
                    onManage={(trigger) => {
                      groupTrigger.current = trigger;
                      setGroupOpen(true);
                    }}
                  />
                  <ErrorNote message={groups.error} />
                </>
              )}
              {courses.data && courses.error && (
                <ErrorNote message={courses.error} />
              )}
              <section
                className="training-section"
                aria-label={t(
                  view === "home"
                    ? "Recent presentations"
                    : "Presentation library",
                )}
              >
                <div
                  className={
                    view === "courses"
                      ? "sr-only"
                      : `section-title ${view === "courses" ? "library-section-title" : ""}`
                  }
                >
                  <h2>
                    {search
                      ? t("Search results")
                      : view === "home"
                        ? t("Recent presentations")
                        : groupFilter !== "all"
                          ? groups.data?.groups.find(
                              (group) => group.id === groupFilter,
                            )?.name || t("All presentations")
                          : t("All presentations")}
                  </h2>
                  {view === "courses" && courses.data && (
                    <span className="library-result-count" role="status">
                      {t("{count} presentations", {
                        count: trainingList.length,
                      })}
                    </span>
                  )}
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
                            !!c.groupId &&
                            !!groups.data?.groups.length &&
                            (cardIndex === 0 ||
                              trainingList[cardIndex - 1].groupId !==
                                c.groupId) && (
                              <div className="library-group-heading">
                                <h3>
                                  {groups.data.groups.find(
                                    (group) => group.id === c.groupId,
                                  )?.name || t("All presentations")}
                                </h3>
                              </div>
                            )}
                          <article className="training-card" key={c.id}>
                            <TrainingCover course={c} />
                            <div className="training-card-content">
                              <div className="training-card-heading">
                                <h3>
                                  <button
                                    className="training-card-open"
                                    onPointerEnter={() =>
                                      preparePresentation(c)
                                    }
                                    onFocus={() => preparePresentation(c)}
                                    onClick={() =>
                                      navigate(
                                        `/training/${c.id}${c.status === "live" ? "/live" : ""}`,
                                      )
                                    }
                                  >
                                    <span>{c.name}</span>
                                  </button>
                                </h3>
                                <TrainingCardMenu
                                  course={c}
                                  groups={groups.data?.groups || []}
                                  onChanged={async (change) => {
                                    await courses.refresh();
                                    setLibraryNotice({
                                      message:
                                        change.action === "trash"
                                          ? t("{name} moved to Trash.", {
                                              name: change.name,
                                            })
                                          : t("Moved to {folder}.", {
                                              folder:
                                                groups.data?.groups.find(
                                                  (group) =>
                                                    group.id === change.groupId,
                                                )?.name ||
                                                t("All presentations"),
                                            }),
                                      groupId:
                                        change.action === "group"
                                          ? change.groupId || "ungrouped"
                                          : undefined,
                                      trash: change.action === "trash",
                                    });
                                    if (view === "courses")
                                      activeGroup.current?.focus();
                                    else newTrainingTrigger.current?.focus();
                                  }}
                                />
                              </div>
                              <div className="card-meta">
                                <span>
                                  {dateTime(c.startedAt || c.createdAt, locale)}
                                  {c.groupId && view === "home" && (
                                    <small>
                                      {
                                        groups.data?.groups.find(
                                          (group) => group.id === c.groupId,
                                        )?.name
                                      }
                                    </small>
                                  )}
                                </span>
                                {c.status !== "ended" && (
                                  <Status status={c.status} />
                                )}
                              </div>
                              <div className="training-card-next">
                                <MemberAvatar
                                  name={c.createdBy || t("Unknown creator")}
                                />
                                <span className="created-by">
                                  <small>{t("Created by")}</small>
                                  <strong>
                                    {c.createdBy || t("Unknown creator")}
                                  </strong>
                                </span>
                              </div>
                            </div>
                          </article>
                        </Fragment>
                      ))}
                  </div>
                ) : (
                  <Empty
                    illustration={
                      hasTrainingFilters && !emptyGroup ? false : "training"
                    }
                    title={
                      emptyGroup
                        ? t("This folder is ready for your training")
                        : hasTrainingFilters
                          ? t("No matching training found")
                          : t("Create your first training")
                    }
                    description={
                      emptyGroup
                        ? t(
                            "Create training here or move existing training from its options menu.",
                          )
                        : hasTrainingFilters
                          ? t("Adjust your search, folder or date filters.")
                          : t(
                              "Upload your presentation. Activities and voice practice await in your training workspace.",
                            )
                    }
                  >
                    {emptyGroup ? (
                      <button
                        className="button primary"
                        onClick={(event) => openCreation(event.currentTarget)}
                      >
                        <Icon name="plus" />
                        {t("Create training in this folder")}
                      </button>
                    ) : hasTrainingFilters ? (
                      <button
                        className="button"
                        onClick={() => {
                          setSearch("");
                          setGroupFilter("all");
                          setTrainingPeriod(ALL_TIME);
                        }}
                      >
                        {t(emptyGroup ? "View all training" : "Clear filters")}
                      </button>
                    ) : (
                      <button
                        className="button primary"
                        onClick={(event) => openCreation(event.currentTarget)}
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
                paused={
                  accountOpen ||
                  helpOpen ||
                  groupOpen ||
                  create ||
                  createTeamOpen ||
                  inviteTeamOpen ||
                  !!featurePicker
                }
                draftCount={drafts.length}
                ready={!!courses.data}
                onExplore={(feature, trigger) => {
                  if (feature === "reports") {
                    change("reports");
                    return;
                  }
                  featureTrigger.current = trigger;
                  if (drafts.length > 1) {
                    setFeaturePicker(feature);
                    return;
                  }
                  const course = drafts[0];
                  if (!course) {
                    openCreation(trigger, feature);
                    return;
                  }
                  navigate(
                    `/training/${course.id}${feature === "practice" ? "/practice" : ""}`,
                  );
                }}
              />
            )}
          </div>
        )}
      </main>
      {libraryNotice && (
        <div className="workspace-feedback" role="status">
          <Icon name="check" size={18} />
          <span>{libraryNotice.message}</span>
          <button
            className="text-button"
            onClick={() => {
              if (libraryNotice.trash) change("trash");
              else {
                change("courses");
                setGroupFilter(libraryNotice.groupId || "all");
              }
              setLibraryNotice(null);
            }}
          >
            {t(libraryNotice.trash ? "Open Trash" : "View folder")}
          </button>
          <button
            className="icon-button"
            aria-label={t("Dismiss")}
            onClick={() => setLibraryNotice(null)}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
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
          const [updated] = await Promise.all([
            groups.refresh(),
            courses.refresh(),
          ]);
          if (
            groupFilter !== "all" &&
            groupFilter !== "ungrouped" &&
            updated &&
            !updated.groups.some((group) => group.id === groupFilter)
          )
            setGroupFilter("all");
        }}
      />

      {createTeamOpen && (
        <CreateTeamDialog
          returnFocusRef={teamTrigger}
          onClose={() => setCreateTeamOpen(false)}
          onCreated={(data) => {
            team.setData(data);
            setCreateTeamOpen(false);
            change("team");
          }}
        />
      )}
      {inviteTeamOpen && team.data?.team && (
        <InviteTeamDialog
          teamName={team.data.team.name}
          returnFocusRef={teamTrigger}
          onClose={() => setInviteTeamOpen(false)}
          onChanged={refreshTeam}
        />
      )}
      {featurePicker && (
        <TrainingPicker
          feature={featurePicker}
          courses={drafts}
          returnFocusRef={featureTrigger}
          onClose={() => setFeaturePicker(null)}
          onPick={(course) => {
            navigate(
              `/training/${course.id}${featurePicker === "practice" ? "/practice" : ""}`,
            );
            setFeaturePicker(null);
          }}
        />
      )}
      {create && (
        <CreateTraining
          onFoldersChanged={groups.refresh}
          open
          folders={groups.data?.groups || []}
          initialFolderId={destinationFolder}
          returnFocusRef={featureTrigger}
          onClose={() => setCreate(false)}
          onCreated={(c) =>
            navigate(
              `/training/${c.id}${createDestination === "practice" ? "/practice" : ""}`,
            )
          }
        />
      )}
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
  participantScope = false,
}: {
  onJoin?: (id: string) => void;
  initialCode?: string;
  participantScope?: boolean;
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
          const result = await api(
            participantScope ? "participant/join" : "join",
            { code },
          );
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

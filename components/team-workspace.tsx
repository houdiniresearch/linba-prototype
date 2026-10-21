"use client";
import { TeamWorkspaceSkeleton } from "./skeletons";
import { useRef, useState, type RefObject } from "react";
import type { TeamPerson, TeamState } from "@/lib/teams";
import type { User } from "@/lib/types";
import { useProductLocale as useLocale } from "./product-locale";
import {
  api,
  dateTime,
  Empty,
  ErrorNote,
  Icon,
  Modal,
  ResourceFailure,
} from "./ui";

export function MemberAvatar({ name }: { name: string }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toLocaleUpperCase();
  return (
    <span className="avatar team-member-avatar" aria-hidden="true">
      {initials || "L"}
    </span>
  );
}
export function TeamHeader({
  data,
  user,
  onOpen,
  onInvite,
}: {
  data?: TeamState;
  user: User;
  onOpen: () => void;
  onInvite: (trigger: HTMLElement) => void;
}) {
  const { t } = useLocale();
  const people = data?.team ? data.members : [{ id: user.id, name: user.name }];
  return (
    <div className="workspace-team-actions">
      <button
        type="button"
        className="team-avatar-stack"
        disabled={!data}
        onClick={onOpen}
        aria-label={data?.team ? t("View team members") : t("Create team")}
        title={data?.team?.name || t("Create team")}
      >
        {people.slice(0, 3).map((person) => (
          <MemberAvatar key={person.id} name={person.name} />
        ))}
        {people.length > 3 && (
          <span className="team-member-overflow">+{people.length - 3}</span>
        )}
      </button>
      <button
        type="button"
        className="team-invite-trigger"
        disabled={!data}
        onClick={(event) => onInvite(event.currentTarget)}
        aria-label={t("Invite teammates")}
        title={t("Invite teammates")}
      >
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}
export function CreateTeamDialog({
  onClose,
  onCreated,
  returnFocusRef,
}: {
  onClose: () => void;
  onCreated: (state: TeamState) => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const { t } = useLocale();
  const [name, setName] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Modal
      open
      onClose={onClose}
      title={t("Create your team")}
      description={t(
        "Keep your presentations and reports together with your team.",
      )}
      returnFocusRef={returnFocusRef}
      closeDisabled={busy}
      className="team-create-modal"
    >
      <form
        aria-busy={busy}
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          setBusy(true);
          setError("");
          try {
            onCreated(await api<TeamState>("team", { name }));
          } catch (e) {
            setError((e as Error).message);
            setBusy(false);
          }
        }}
      >
        <label>
          {t("Team name")}
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
            placeholder={t("For example, SUCool")}
            disabled={busy}
          />
        </label>
        <div className="team-access-note">
          <Icon name="shield" size={19} />
          <p>
            {t(
              "Team members can access and edit all presentations and reports in this workspace.",
            )}
          </p>
        </div>
        <ErrorNote message={error} />
        <div className="modal-actions">
          <button
            type="button"
            className="button"
            onClick={onClose}
            disabled={busy}
          >
            {t("Cancel")}
          </button>
          <button className="button primary" disabled={busy || !name.trim()}>
            {t(busy ? "Creating…" : "Create team")}
            <Icon
              name={busy ? "spinner" : "arrow"}
              size={18}
              className={busy ? "spin" : undefined}
            />
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function InviteTeamDialog({
  teamName,
  onClose,
  onChanged,
  returnFocusRef,
}: {
  teamName: string;
  onClose: () => void;
  onChanged: () => Promise<unknown>;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const { t } = useLocale();
  const [email, setEmail] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [link, setLink] = useState(""),
    [copied, setCopied] = useState(false);
  const linkField = useRef<HTMLInputElement>(null);
  return (
    <Modal
      open
      onClose={onClose}
      title={t("Invite teammates")}
      description={teamName}
      returnFocusRef={returnFocusRef}
      closeDisabled={busy}
      className="team-invite-modal"
    >
      <form
        aria-busy={busy}
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          setBusy(true);
          setError("");
          setCopied(false);
          setLink("");
          try {
            const result = await api<{ path: string }>("team/invites", {
              email,
            });
            setLink(new URL(result.path, location.origin).href);
            void onChanged().catch(() => {});
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          {t("Email address")}
          <input
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setLink("");
              setError("");
            }}
            required
            maxLength={254}
            placeholder={t("colleague@example.com")}
            disabled={busy}
          />
        </label>
        <div className="team-invite-permission">
          <Icon name="shield" size={20} />
          <div>
            <strong>{t("Team member")}</strong>
            <p>
              {t(
                "Team members can access and edit all presentations and reports in this workspace.",
              )}
            </p>
          </div>
        </div>
        <p className="team-invite-help">
          <Icon name="link" size={16} />
          {t(
            "Share the link with your teammate. Valid for 7 days; no email is sent.",
          )}
        </p>
        <ErrorNote message={error} />
        {link && (
          <div className="team-invite-result" role="status">
            <label>
              {t("Invitation link")}
              <input
                ref={linkField}
                value={link}
                readOnly
                onFocus={(event) => event.currentTarget.select()}
              />
            </label>
            <button
              type="button"
              className="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(link);
                  setCopied(true);
                } catch {
                  linkField.current?.focus();
                  linkField.current?.select();
                  setError("Copy the selected invitation link manually.");
                }
              }}
            >
              <Icon name={copied ? "check" : "link"} size={18} />
              {t(copied ? "Link copied" : "Copy invitation link")}
            </button>
          </div>
        )}
        <div className="modal-actions">
          <button
            type="button"
            className="button"
            onClick={onClose}
            disabled={busy}
          >
            {t(link ? "Done" : "Cancel")}
          </button>
          {!link && (
            <button className="button primary" disabled={busy || !email.trim()}>
              {t(busy ? "Creating…" : "Create invitation link")}
              <Icon
                name={busy ? "spinner" : "arrow"}
                size={18}
                className={busy ? "spin" : undefined}
              />
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
export function TeamWorkspace({
  data,
  error,
  user,
  onChanged,
  onCreate,
  onInvite,
  onReport,
}: {
  data?: TeamState;
  error: string;
  user: User;
  onChanged: () => Promise<unknown>;
  onCreate: (trigger: HTMLElement) => void;
  onInvite: (trigger: HTMLElement) => void;
  onReport: (id: string) => void;
}) {
  const { t, locale } = useLocale();
  const [tab, setTab] = useState<"members" | "reports">("members");
  const [busy, setBusy] = useState(""),
    [notice, setNotice] = useState(""),
    [failure, setFailure] = useState("");
  const [editing, setEditing] = useState(false),
    [name, setName] = useState("");
  const [confirm, setConfirm] = useState<{
    person: TeamPerson;
    transfer?: boolean;
  } | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  async function action(key: string, run: () => Promise<unknown>) {
    if (busy) return;
    setBusy(key);
    setFailure("");
    setNotice("");
    try {
      await run();
      await onChanged();
      return true;
    } catch (e) {
      setFailure((e as Error).message);
      return false;
    } finally {
      setBusy("");
    }
  }
  if (!data)
    return error ? (
      <ResourceFailure error={error} onRetry={onChanged} />
    ) : (
      <TeamWorkspaceSkeleton />
    );
  if (!data.team)
    return (
      <div className="team-workspace">
        <div className="page-title">
          <div>
            <h1>{t("Your team, in one workspace.")}</h1>
            <p className="muted">
              {t(
                "Review training together, with everyone looking at the same report.",
              )}
            </p>
          </div>
        </div>
        <Empty
          icon="users"
          illustration={false}
          title={t("Create your team")}
          description={t(
            "Invite colleagues to work together on presentations, activities and reports.",
          )}
        >
          <button
            className="button primary"
            onClick={(e) => onCreate(e.currentTarget)}
          >
            <Icon name="plus" />
            {t("Create team")}
          </button>
        </Empty>
      </div>
    );
  const team = data.team,
    owner = team.ownerId === user.id;
  return (
    <div className="team-workspace">
      <div className="page-title">
        <div>
          {editing ? (
            <form
              className="team-name-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (
                  await action("rename", () => api("team", { name }, "PATCH"))
                )
                  setEditing(false);
              }}
            >
              <label className="sr-only" htmlFor="team-name">
                {t("Team name")}
              </label>
              <input
                id="team-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={80}
              />
              <button className="button" disabled={!!busy || !name.trim()}>
                {t("Save")}
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label={t("Cancel")}
                onClick={() => setEditing(false)}
              >
                <Icon name="close" />
              </button>
            </form>
          ) : (
            <h1>
              {team.name}
              {owner && (
                <button
                  className="icon-button team-rename"
                  aria-label={t("Rename team")}
                  onClick={() => {
                    setName(team.name);
                    setEditing(true);
                  }}
                >
                  <Icon name="edit" size={17} />
                </button>
              )}
            </h1>
          )}
          <p className="muted">
            {t("Your people, presentations and reports, in one place.")}
          </p>
        </div>
        <button
          className="button primary"
          onClick={(e) => onInvite(e.currentTarget)}
        >
          <Icon name="plus" size={18} />
          {t("Invite teammates")}
        </button>
      </div>
      <nav className="team-tabs" aria-label={t("Team sections")}>
        <button
          aria-current={tab === "members" ? "page" : undefined}
          onClick={() => setTab("members")}
        >
          {t("Members")}
          <span>{data.members.length}</span>
        </button>
        <button
          aria-current={tab === "reports" ? "page" : undefined}
          onClick={() => setTab("reports")}
        >
          {t("Team reports")}
          <span>{data.reports.length}</span>
        </button>
      </nav>
      <ErrorNote message={error || failure} />
      {notice && (
        <p role="status" className="team-notice">
          {t(notice)}
        </p>
      )}
      {tab === "members" ? (
        <>
          <div className="team-section-heading">
            <h2>{t("People in your team")}</h2>
            <p>
              {t(
                "Team members can access and edit all presentations and reports in this workspace.",
              )}
            </p>
          </div>
          <ul className="team-member-list">
            {data.members.map((person) => (
              <li key={person.id}>
                <MemberAvatar name={person.name} />
                <div className="team-person">
                  <strong>
                    {person.name}
                    {person.id === user.id && <span> · {t("You")}</span>}
                  </strong>
                  <span>{person.email || t("Exploration account")}</span>
                </div>
                <span className="team-role">
                  {t(person.role === "owner" ? "Team owner" : "Member")}
                </span>
                {owner && person.id !== user.id && (
                  <div className="team-member-actions">
                    <button
                      className="text-button"
                      disabled={!!busy}
                      onClick={(e) => {
                        trigger.current = e.currentTarget;
                        setConfirm({ person, transfer: true });
                      }}
                    >
                      {t("Make owner")}
                    </button>
                    <button
                      className="icon-button"
                      aria-label={t("Remove {name} from team", {
                        name: person.name,
                      })}
                      disabled={!!busy}
                      onClick={(e) => {
                        trigger.current = e.currentTarget;
                        setConfirm({ person });
                      }}
                    >
                      <Icon name="close" size={18} />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          {data.invites.length > 0 && (
            <section className="team-pending">
              <h2>{t("Pending invitations")}</h2>
              <ul className="team-member-list">
                {data.invites.map((invite) => (
                  <li key={invite.id}>
                    <span className="team-pending-icon">
                      <Icon name="clock" size={20} />
                    </span>
                    <div className="team-person">
                      <strong>{invite.email}</strong>
                      <span>
                        {t("Expires {date}", {
                          date: dateTime(invite.expiresAt, locale),
                        })}
                      </span>
                    </div>
                    <span className="team-role">{t("Pending")}</span>
                    {invite.canManage && (
                      <button
                        className="text-button"
                        disabled={!!busy}
                        onClick={() =>
                          void action(invite.id, () =>
                            api(
                              `team/invites/${invite.id}`,
                              undefined,
                              "DELETE",
                            ),
                          )
                        }
                      >
                        {t("Revoke invitation")}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {!owner && (
            <button
              className="text-button team-leave"
              onClick={(e) => {
                trigger.current = e.currentTarget;
                const person = data.members.find((p) => p.id === user.id)!;
                setConfirm({ person });
              }}
            >
              {t("Leave team")}
            </button>
          )}
        </>
      ) : (
        <>
          <div className="team-section-heading">
            <h2>{t("Team presentation reports")}</h2>
            <p>
              {t(
                "Reports from every team presentation appear here automatically.",
              )}
            </p>
          </div>
          {data.reports.length ? (
            <ul className="team-report-list">
              {data.reports.map((report) => (
                <li key={report.id}>
                  <button onClick={() => onReport(report.id)}>
                    <Icon name="chart" size={21} />
                    <div>
                      <strong>{report.name}</strong>
                      <span>
                        {report.author}
                        {report.endedAt &&
                          ` · ${dateTime(report.endedAt, locale)}`}
                      </span>
                    </div>
                    <Icon name="arrow" size={18} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <Empty
              icon="chart"
              compact
              title={t("Start reviewing together")}
              description={t(
                "Reports appear here when a team presentation ends.",
              )}
            />
          )}
        </>
      )}
      {confirm && (
        <Modal
          open
          onClose={() => {
            setConfirm(null);
            setFailure("");
          }}
          closeDisabled={!!busy}
          returnFocusRef={trigger}
          title={t(
            confirm.transfer
              ? "Transfer team ownership?"
              : confirm.person.id === user.id
                ? "Leave this team?"
                : "Remove team member?",
          )}
          description={t(
            confirm.transfer
              ? "{name} will manage the team and its members. You will stay as a member."
              : "{name} will lose access to team reports. Their own presentations and reports will be kept.",
            { name: confirm.person.name },
          )}
        >
          <ErrorNote message={failure} />
          <div className="modal-actions">
            <button
              className="button"
              disabled={!!busy}
              onClick={() => setConfirm(null)}
            >
              {t("Cancel")}
            </button>
            <button
              className={`button ${confirm.transfer ? "primary" : "danger"}`}
              disabled={!!busy}
              onClick={async () => {
                const ok = await action("member", () =>
                  confirm.transfer
                    ? api("team/owner", { userId: confirm.person.id }, "PATCH")
                    : api(
                        `team/members/${confirm.person.id}`,
                        undefined,
                        "DELETE",
                      ),
                );
                if (ok) setConfirm(null);
              }}
            >
              {t(
                confirm.transfer
                  ? "Transfer ownership"
                  : confirm.person.id === user.id
                    ? "Leave team"
                    : "Remove member",
              )}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

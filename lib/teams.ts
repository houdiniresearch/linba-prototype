import { createHash, randomBytes, randomUUID } from "node:crypto";
import { AppError } from "./auth";
import { all, find, transaction, get, put, remove } from "./db";
import type { Course, User } from "./types";
export type Team = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
};
export type TeamMember = {
  id: string;
  teamId: string;
  userId: string;
  joinedAt: string;
};
export type TeamInvite = {
  id: string;
  teamId: string;
  email: string;
  tokenHash: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  acceptedBy?: string;
  revokedAt?: string;
};
export type TeamPerson = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "member";
  joinedAt: string;
};
export type TeamReport = {
  id: string;
  name: string;
  endedAt?: string;
  author: string;
  shared: boolean;
};
export type TeamState = {
  team: Team | null;
  members: TeamPerson[];
  invites: {
    id: string;
    email: string;
    expiresAt: string;
    canManage: boolean;
  }[];
  reports: TeamReport[];
  ownReports: TeamReport[];
};
function instructor(user: User) {
  if (user.role !== "teacher")
    throw new AppError("Teams are available to workspace accounts.", 403);
}
export async function teamFor(user: User) {
  const membership = (
    await find<TeamMember>("team-member", { userId: user.id })
  )[0];
  return membership ? await get<Team>("team", membership.teamId) : undefined;
}
/** An active teammate has the same content capabilities as its creator. */
export async function canAccessWorkspaceContent(user: User, creatorId: string) {
  if (user.role !== "teacher") return false;
  if (creatorId === user.id) return true;
  const team = await teamFor(user);
  return !!team && !!(await get("team-member", `${team.id}:${creatorId}`));
}
export async function canManagePresentation(user: User, course: Course) {
  return await canAccessWorkspaceContent(user, course.ownerId);
}
async function requireTeam(user: User) {
  instructor(user);
  const team = await teamFor(user);
  if (!team) throw new AppError("Create or join a team first.", 404);
  return team;
}
async function ownerTeam(user: User) {
  const team = await requireTeam(user);
  if (team.ownerId !== user.id)
    throw new AppError(
      "Only the team owner can manage members and team settings.",
      403,
    );
  return team;
}
function teamName(value: unknown) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 80)
    throw new AppError("Enter a team name between 1 and 80 characters.");
  return value.trim();
}
export async function createTeam(user: User, name: unknown) {
  instructor(user);
  if (await teamFor(user))
    throw new AppError("You already belong to a team.", 409);
  const team = {
    id: randomUUID(),
    name: teamName(name),
    ownerId: user.id,
    createdAt: new Date().toISOString(),
  };
  await transaction(async () => {
    await put("team", team);
    await put<TeamMember>("team-member", {
      id: `${team.id}:${user.id}`,
      teamId: team.id,
      userId: user.id,
      joinedAt: team.createdAt,
    });
  });
  return team;
}
export async function renameTeam(user: User, name: unknown) {
  return await put("team", {
    ...(await ownerTeam(user)),
    name: teamName(name),
  });
}
const digest = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function createTeamInvite(user: User, value: unknown) {
  const team = await requireTeam(user);
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254)
    throw new AppError("Enter a valid email address.");
  const existingUser = (await all<User>("user")).find(
    (u) => u.email.toLowerCase() === email,
  );
  if (
    existingUser &&
    (await get("team-member", `${team.id}:${existingUser.id}`))
  )
    throw new AppError("This person is already in your team.", 409);
  const pending = (await all<TeamInvite>("team-invite")).filter(
    (i) =>
      i.teamId === team.id &&
      !i.acceptedBy &&
      !i.revokedAt &&
      Date.parse(i.expiresAt) > Date.now(),
  );
  if (pending.length >= 50 && !pending.some((i) => i.email === email))
    throw new AppError(
      "There are too many pending invitations. Revoke an invitation first.",
      409,
    );
  const token = randomBytes(32).toString("hex"),
    now = new Date().toISOString();
  for (const invite of pending.filter((i) => i.email === email)) {
    if (invite.createdBy !== user.id && team.ownerId !== user.id)
      throw new AppError(
        "Ask the inviter or team owner to renew this invitation.",
        403,
      );
    await put("team-invite", { ...invite, revokedAt: now });
  }
  const invite = await put<TeamInvite>("team-invite", {
    id: randomUUID(),
    teamId: team.id,
    email,
    tokenHash: digest(token),
    createdBy: user.id,
    createdAt: now,
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
  });
  return {
    id: invite.id,
    path: `/invite/${token}`,
    expiresAt: invite.expiresAt,
  };
}
export async function inspectTeamInvite(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token))
    throw new AppError("This invitation is invalid or has expired.", 404);
  const invite = (await all<TeamInvite>("team-invite")).find(
    (i) => i.tokenHash === digest(token),
  );
  const team = invite && (await get<Team>("team", invite.teamId));
  if (
    !invite ||
    !team ||
    invite.revokedAt ||
    Date.parse(invite.expiresAt) <= Date.now()
  )
    throw new AppError("This invitation is invalid or has expired.", 410);
  return { invite, team };
}
export async function acceptTeamInvite(user: User, token: string) {
  instructor(user);
  const { invite, team } = await inspectTeamInvite(token);
  if (!user.email || user.email.toLowerCase() !== invite.email)
    throw new AppError(
      "Sign in with the email address this invitation was sent to.",
      403,
    );
  if (invite.acceptedBy && invite.acceptedBy !== user.id)
    throw new AppError("This invitation has already been used.", 409);
  const existing = await teamFor(user);
  if (existing && existing.id !== team.id)
    throw new AppError("Leave your current team before joining another.", 409);
  await transaction(async () => {
    if (!(await get("team-member", `${team.id}:${user.id}`)))
      await put<TeamMember>("team-member", {
        id: `${team.id}:${user.id}`,
        teamId: team.id,
        userId: user.id,
        joinedAt: new Date().toISOString(),
      });
    await put("team-invite", { ...invite, acceptedBy: user.id });
  });
  return team;
}
export async function revokeTeamInvite(user: User, id: string) {
  const team = await requireTeam(user),
    invite = await get<TeamInvite>("team-invite", id);
  if (
    !invite ||
    invite.teamId !== team.id ||
    (invite.createdBy !== user.id && team.ownerId !== user.id)
  )
    throw new AppError("Invitation not found.", 404);
  await put("team-invite", { ...invite, revokedAt: new Date().toISOString() });
}
export async function removeTeamMember(user: User, userId: string) {
  const team = await requireTeam(user);
  if (userId !== user.id && team.ownerId !== user.id)
    throw new AppError(
      "Only the team owner can manage members and team settings.",
      403,
    );
  if (userId === team.ownerId)
    throw new AppError("Transfer ownership before leaving the team.", 409);
  if (!(await get("team-member", `${team.id}:${userId}`)))
    throw new AppError("Team member not found.", 404);
  await remove("team-member", `${team.id}:${userId}`);
  // Clear the legacy sharing flag; current membership determines workspace access.
  for (const course of (await all<Course>("course")).filter(
    (c) => c.ownerId === userId && c.reportTeamId === team.id,
  )) {
    const { reportTeamId: _team, ...privateCourse } = course;
    await put("course", privateCourse);
  }
  for (const invite of (await all<TeamInvite>("team-invite")).filter(
    (i) =>
      i.teamId === team.id &&
      (i.createdBy === userId || i.acceptedBy === userId),
  ))
    await put("team-invite", {
      ...invite,
      revokedAt: new Date().toISOString(),
    });
}
export async function transferTeamOwnership(user: User, userId: string) {
  const team = await ownerTeam(user);
  if (!(await get("team-member", `${team.id}:${userId}`)))
    throw new AppError("Team member not found.", 404);
  return await put("team", { ...team, ownerId: userId });
}
export async function canReadReport(user: User, course: Course) {
  if (user.role !== "teacher" || course.trashedAt || course.status !== "ended")
    return false;
  return await canManagePresentation(user, course);
}
export async function requireReport(user: User, id: string) {
  const course = await get<Course>("course", id);
  if (!course || !(await canReadReport(user, course)))
    throw new AppError("Report not found.", 404);
  return course;
}
/** Resolve the workspace once, rather than authorizing every unrelated deck. */
export async function workspaceCourses(user: User): Promise<Course[]> {
  if (user.role !== "teacher") {
    const memberships = await find<{ courseId: string }>("member", {
      userId: user.id,
    });
    const courses = await Promise.all(
      memberships.map((m) => get<Course>("course", m.courseId)),
    );
    return courses.filter((c): c is Course => !!c && !c.trashedAt);
  }
  return find<Course>("course", { ownerId: await workspaceOwnerIds(user) });
}
export async function workspaceOwnerIds(user: User): Promise<string[]> {
  instructor(user);
  const team = await teamFor(user);
  const people = team
    ? await find<TeamMember>("team-member", { teamId: team.id })
    : [];
  return [...new Set([user.id, ...people.map((m) => m.userId)])];
}

export async function teamState(
  user: User,
  summary = false,
): Promise<TeamState> {
  instructor(user);
  const team = await teamFor(user);
  if (!team)
    return {
      team: null,
      members: [],
      invites: [],
      reports: [],
      ownReports: [],
    };
  const [people, invites, courses] = await Promise.all([
    find<TeamMember>("team-member", { teamId: team.id }),
    summary ? [] : find<TeamInvite>("team-invite", { teamId: team.id }),
    summary ? [] : workspaceCourses(user),
  ]);
  const members = await Promise.all(
    people.map(async (m): Promise<TeamPerson> => {
      const account = await get<User>("user", m.userId);
      return {
        id: m.userId,
        name: account?.name || "",
        email: account?.email || "",
        joinedAt: m.joinedAt,
        role: m.userId === team.ownerId ? "owner" : "member",
      };
    }),
  );
  const reports = courses
    .filter((c) => c.status === "ended" && !c.trashedAt)
    .sort((a, b) => (b.endedAt || "").localeCompare(a.endedAt || ""));
  const reportItems = await Promise.all(
    reports.map(async (c): Promise<TeamReport> => ({
      id: c.id,
      name: c.name,
      endedAt: c.endedAt,
      author: (await get<User>("user", c.ownerId))?.name || "",
      shared: true,
    })),
  );
  return {
    team,
    members: members.sort(
      (a, b) =>
        Number(b.role === "owner") - Number(a.role === "owner") ||
        a.name.localeCompare(b.name),
    ),
    invites: invites
      .filter(
        (i) =>
          !i.revokedAt && !i.acceptedBy && Date.parse(i.expiresAt) > Date.now(),
      )
      .map((i) => ({
        id: i.id,
        email: i.email,
        expiresAt: i.expiresAt,
        canManage: i.createdBy === user.id || team.ownerId === user.id,
      })),
    reports: reportItems,
    ownReports: reportItems.filter(
      (item) => reports.find((c) => c.id === item.id)?.ownerId === user.id,
    ),
  };
}

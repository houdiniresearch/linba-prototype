import { randomUUID } from "node:crypto";
import { AppError } from "./auth";
import { find, transaction, get, put, remove } from "./db";
import {
  canAccessWorkspaceContent,
  workspaceCourses,
  workspaceOwnerIds,
} from "./teams";
import { courseForOwner } from "./courses";
import { trainingFamily } from "./training-sessions";
import type { Course, User } from "./types";
export type TrainingGroup = {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
};
function teacher(user: User) {
  if (user.role !== "teacher")
    throw new AppError("This area is unavailable for this account type.", 403);
}
async function groupFor(user: User, id: string) {
  const group = await get<TrainingGroup>("training-group", id);
  if (!group || !(await canAccessWorkspaceContent(user, group.userId)))
    throw new AppError("Folder not found.", 404);
  return group;
}
function groupName(value: unknown) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 60)
    throw new AppError("Use a folder name between 1 and 60 characters.");
  return value.trim();
}
export async function trainingGroups(user: User) {
  teacher(user);
  return (
    await find<TrainingGroup>("training-group", {
      userId: await workspaceOwnerIds(user),
    })
  ).sort((a, b) => a.name.localeCompare(b.name));
}
export async function saveTrainingGroup(
  user: User,
  value: unknown,
  id?: string,
) {
  teacher(user);
  const name = groupName(value);
  const previous = id ? await groupFor(user, id) : undefined;
  if (
    (await trainingGroups(user)).some(
      (group) =>
        group.id !== id &&
        group.name.toLocaleLowerCase("tr-TR") ===
          name.toLocaleLowerCase("tr-TR"),
    )
  )
    throw new AppError("A folder with this name already exists.");
  return await put("training-group", {
    id: previous?.id || randomUUID(),
    userId: previous?.userId || user.id,
    name,
    createdAt: previous?.createdAt || new Date().toISOString(),
  } satisfies TrainingGroup);
}
export async function removeTrainingGroup(user: User, id: string) {
  teacher(user);
  await groupFor(user, id);
  await transaction(async () => {
    for (const course of (await workspaceCourses(user)).filter(
      (course) => course.groupId === id,
    )) {
      delete course.groupId;
      await put("course", course);
    }
    await remove("training-group", id);
  });
}
// Keep the existing storage schema; folder is the user-facing library term.
export async function trainingFolderId(user: User, value: unknown) {
  teacher(user);
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string")
    throw new AppError("Choose a training folder.");
  return (await groupFor(user, value)).id;
}
export async function updateTrainingLibrary(
  user: User,
  id: string,
  action: "group" | "trash" | "restore",
  groupId?: unknown,
) {
  teacher(user);
  const source = await courseForOwner(id, user);
  if (
    action === "group" &&
    groupId !== null &&
    groupId !== "" &&
    typeof groupId !== "string"
  )
    throw new AppError("Choose a training folder.");
  if (action === "group" && typeof groupId === "string" && groupId)
    await groupFor(user, groupId);
  const family = (await workspaceCourses(user)).filter(
    (course) => trainingFamily(course) === trainingFamily(source),
  );
  if (action === "trash" && family.some((course) => course.status === "live"))
    throw new AppError(
      "End the live session before moving this training to Trash.",
      409,
    );
  await transaction(async () => {
    for (const course of family) {
      if (action === "group")
        course.groupId =
          typeof groupId === "string" && groupId ? groupId : undefined;
      if (action === "trash") course.trashedAt ||= new Date().toISOString();
      if (action === "restore") delete course.trashedAt;
      await put("course", course);
    }
  });
}

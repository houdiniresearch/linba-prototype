import { randomUUID } from "node:crypto";
import { AppError } from "./auth";
import { all, db, get, put, remove } from "./db";
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
function groupFor(user: User, id: string) {
  const group = get<TrainingGroup>("training-group", id);
  if (!group || group.userId !== user.id)
    throw new AppError("Group not found.", 404);
  return group;
}
function groupName(value: unknown) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 60)
    throw new AppError("Use a group name between 1 and 60 characters.");
  return value.trim();
}
export function trainingGroups(user: User) {
  teacher(user);
  return all<TrainingGroup>("training-group")
    .filter((group) => group.userId === user.id)
    .sort((a, b) => a.name.localeCompare(b.name));
}
export function saveTrainingGroup(user: User, value: unknown, id?: string) {
  teacher(user);
  const name = groupName(value);
  const previous = id ? groupFor(user, id) : undefined;
  if (
    trainingGroups(user).some(
      (group) =>
        group.id !== id &&
        group.name.toLocaleLowerCase("tr-TR") ===
          name.toLocaleLowerCase("tr-TR"),
    )
  )
    throw new AppError("A group with this name already exists.");
  return put("training-group", {
    id: previous?.id || randomUUID(),
    userId: user.id,
    name,
    createdAt: previous?.createdAt || new Date().toISOString(),
  } satisfies TrainingGroup);
}
export function removeTrainingGroup(user: User, id: string) {
  teacher(user);
  groupFor(user, id);
  db().exec("BEGIN IMMEDIATE");
  try {
    for (const course of all<Course>("course").filter(
      (course) => course.ownerId === user.id && course.groupId === id,
    )) {
      delete course.groupId;
      put("course", course);
    }
    remove("training-group", id);
    db().exec("COMMIT");
  } catch (error) {
    db().exec("ROLLBACK");
    throw error;
  }
}
export function updateTrainingLibrary(
  user: User,
  id: string,
  action: "group" | "trash" | "restore",
  groupId?: unknown,
) {
  teacher(user);
  const source = courseForOwner(id, user);
  if (
    action === "group" &&
    groupId !== null &&
    groupId !== "" &&
    typeof groupId !== "string"
  )
    throw new AppError("Choose a training group.");
  if (action === "group" && typeof groupId === "string" && groupId)
    groupFor(user, groupId);
  const family = all<Course>("course").filter(
    (course) =>
      course.ownerId === user.id &&
      trainingFamily(course) === trainingFamily(source),
  );
  if (action === "trash" && family.some((course) => course.status === "live"))
    throw new AppError(
      "End the live session before moving this training to Trash.",
      409,
    );
  db().exec("BEGIN IMMEDIATE");
  try {
    for (const course of family) {
      if (action === "group")
        course.groupId =
          typeof groupId === "string" && groupId ? groupId : undefined;
      if (action === "trash") course.trashedAt ||= new Date().toISOString();
      if (action === "restore") delete course.trashedAt;
      put("course", course);
    }
    db().exec("COMMIT");
  } catch (error) {
    db().exec("ROLLBACK");
    throw error;
  }
}

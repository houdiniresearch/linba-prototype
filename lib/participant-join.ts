import { randomUUID } from "node:crypto";
import { AppError } from "./auth";
import { all, put } from "./db";
import { canChat } from "./courses";
import type { Course, User } from "./types";
export async function joinablePresentation(code: unknown) {
  if (typeof code !== "string" || !/^\d{6}$/u.test(code.trim()))
    throw new AppError("Enter a 6-digit presentation code.");
  const course = (await all<Course>("course")).find(
    (course) => course.code === code.trim(),
  );
  if (
    !course ||
    course.trashedAt ||
    (!canChat(course) && course.status !== "draft")
  )
    throw new AppError("Training was not found or access has expired.", 404);
  return course;
}
export function participantNickname(value: unknown) {
  if (typeof value !== "string")
    throw new AppError("Enter a name between 2 and 40 characters.");
  const nickname = value.normalize("NFKC").trim().replace(/\s+/gu, " ");
  if (
    nickname.length < 2 ||
    nickname.length > 40 ||
    /[\p{Cc}\p{Cf}<>]/u.test(nickname)
  )
    throw new AppError("Enter a name between 2 and 40 characters.");
  return nickname;
}
export async function joinPresentation(course: Course, user: User) {
  if (user.role !== "participant")
    throw new AppError("Sign in as a participant to join training.", 403);
  await put("member", {
    id: `${course.id}:${user.id}`,
    courseId: course.id,
    userId: user.id,
    name: user.name,
  });
  return course.id;
}
export async function joinAsGuest(
  body: {
    code?: unknown;
    nickname?: unknown;
  },
  current?: User,
) {
  // Validate everything before creating an identity or membership.
  const nickname = participantNickname(body.nickname);
  const course = await joinablePresentation(body.code);
  const user: User =
    current?.guest &&
    current.role === "participant" &&
    current.name === nickname
      ? current
      : {
          id: randomUUID(),
          name: nickname,
          email: "",
          role: "participant",
          guest: true,
        };
  if (user !== current) await put("user", user);
  return { id: await joinPresentation(course, user), user };
}

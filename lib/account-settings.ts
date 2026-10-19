import { AppError, hashPassword, verifyPassword } from "./auth";
import { all, get, put, remove } from "./db";
import type { User } from "./types";
export function accountSettings(user: User) {
  return {
    hasPassword: !!get<User & { password?: string }>("user", user.id)?.password,
    plan: "free",
    invoices: [],
  };
}
export function updateProfile(user: User, body: Record<string, unknown>) {
  const current = get<User & { password?: string }>("user", user.id);
  if (!current) throw new AppError("Account not found.", 404);
  if (
    typeof body.name !== "string" ||
    !body.name.trim() ||
    body.name.trim().length > 80
  )
    throw new AppError("Enter a name between 1 and 80 characters.");
  const email = user.demo
    ? current.email
    : typeof body.email === "string"
      ? body.email.trim().toLowerCase()
      : "";
  if (
    !user.demo &&
    (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
  )
    throw new AppError("Enter a valid email address.");
  if (
    email &&
    all<User>("user").some(
      (account) =>
        account.id !== user.id && account.email.toLowerCase() === email,
    )
  )
    throw new AppError("This email is already registered. You can log in.");
  put("user", { ...current, name: body.name.trim(), email });
  return { ...user, name: body.name.trim(), email };
}
export function updateAccountPassword(
  user: User,
  body: Record<string, unknown>,
) {
  const current = get<User & { password?: string }>("user", user.id);
  if (!current?.password || user.demo)
    throw new AppError(
      "Password settings are available for registered accounts.",
      403,
    );
  if (
    typeof body.currentPassword !== "string" ||
    body.currentPassword.length > 128 ||
    !verifyPassword(body.currentPassword, current.password)
  )
    throw new AppError("The current password is incorrect.");
  if (
    typeof body.newPassword !== "string" ||
    body.newPassword.length < 8 ||
    body.newPassword.length > 128
  )
    throw new AppError("Use a password between 8 and 128 characters.");
  if (body.newPassword === body.currentPassword)
    throw new AppError("Choose a different password.");
  put("user", { ...current, password: hashPassword(body.newPassword) });
  for (const session of all<{ id: string; userId: string }>("session").filter(
    (session) => session.userId === user.id,
  ))
    remove("session", session.id);
}

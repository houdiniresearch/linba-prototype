import { cookies } from "next/headers";
import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { get, put, remove } from "./db";
import type { User } from "./types";
export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password: string, encoded: string) {
  const [salt, hash] = encoded.split(":");
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
type SessionScope = "main" | "participant";
const sessionCookie = (scope: SessionScope) =>
  scope === "participant" ? "linba_participant_session" : "linba_session";
export async function setSession(user: User, scope: SessionScope = "main") {
  const token = randomBytes(32).toString("hex");
  await put("session", {
    id: digest(token),
    userId: user.id,
    expires: Date.now() + 7 * 86400000,
  });
  (await cookies()).set(sessionCookie(scope), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.LINBA_HTTPS === "true",
    path: "/",
    maxAge: 7 * 86400,
  });
}
export async function currentUser(
  scope: SessionScope = "main",
): Promise<User | undefined> {
  const token = (await cookies()).get(sessionCookie(scope))?.value;
  if (!token) return;
  const session = await get<{
    userId: string;
    expires: number;
  }>("session", digest(token));
  if (!session || session.expires < Date.now()) return;
  const user = await get<User>("user", session.userId);
  if (!user) return;
  return {
    id: user.id,
    name: user.demo && user.name === "Houdini" ? "BIGG" : user.name,
    email: user.email,
    role: user.role,
    demo: user.demo,
    guest: user.guest,
  };
}
export async function currentParticipant() {
  const scoped = await currentUser("participant");
  if (scoped?.role === "participant") return scoped;
  const main = await currentUser();
  return main?.role === "participant" ? main : undefined;
}
export async function requireParticipant() {
  const user = await currentParticipant();
  if (!user) throw new AppError("Sign in to continue.", 401);
  return user;
}
export async function requireUser(role?: User["role"]) {
  const user = await currentUser();
  if (!user) throw new AppError("Sign in to continue.", 401);
  if (role && user.role !== role)
    throw new AppError("This area is unavailable for this account type.", 403);
  return user;
}
export async function logout(scope: SessionScope = "main") {
  const token = (await cookies()).get(sessionCookie(scope))?.value;
  if (token) await remove("session", digest(token));
  (await cookies()).delete(sessionCookie(scope));
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host") || new URL(request.url).host;
  if (origin && new URL(origin).host !== host)
    throw new AppError("The request could not be verified.", 403);
}
export function apiError(error: unknown) {
  if (error instanceof Error && "databaseConflict" in error)
    return Response.json({ error: error.message }, { status: 409 });
  return Response.json(
    {
      error:
        error instanceof AppError
          ? error.message
          : "The action could not be completed. Please try again.",
    },
    { status: error instanceof AppError ? error.status : 500 },
  );
}

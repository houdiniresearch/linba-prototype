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
export async function setSession(user: User) {
  const token = randomBytes(32).toString("hex");
  put("session", {
    id: digest(token),
    userId: user.id,
    expires: Date.now() + 7 * 86400000,
  });
  (await cookies()).set("linba_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.LINBA_HTTPS === "true",
    path: "/",
    maxAge: 7 * 86400,
  });
}
export async function currentUser(): Promise<User | undefined> {
  const token = (await cookies()).get("linba_session")?.value;
  if (!token) return;
  const session = get<{ userId: string; expires: number }>(
    "session",
    digest(token),
  );
  if (!session || session.expires < Date.now()) return;
  const user = get<User>("user", session.userId);
  if (!user) return;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    demo: user.demo,
  };
}
export async function requireUser(role?: User["role"]) {
  const user = await currentUser();
  if (!user) throw new AppError("Sign in to continue.", 401);
  if (role && user.role !== role)
    throw new AppError("This area is unavailable for this account type.", 403);
  return user;
}
export async function logout() {
  const token = (await cookies()).get("linba_session")?.value;
  if (token) remove("session", digest(token));
  (await cookies()).delete("linba_session");
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host") || new URL(request.url).host;
  if (origin && new URL(origin).host !== host)
    throw new AppError("The request could not be verified.", 403);
}
export function apiError(error: unknown) {
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

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@/lib/types";
import { useProductLocale as useLocale } from "./product-locale";
import { api, ErrorNote, Icon, Logo, ResourceFailure, useResource } from "./ui";

export function TeamInvitation({
  token,
  initialUser,
}: {
  token: string;
  initialUser?: User;
}) {
  const { t } = useLocale(),
    router = useRouter();
  const invitation = useResource<{
    teamName: string;
    email: string;
    expiresAt: string;
  }>(`team-invites/${token}`);
  const [user, setUser] = useState(initialUser),
    [register, setRegister] = useState(true);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function join() {
    await api(`team-invites/${token}`, {});
    router.replace("/?view=team");
    router.refresh();
  }
  return (
    <div className="team-invite-page">
      <header>
        <Link href="/" aria-label={t("LİNBA home")}>
          <Logo />
        </Link>
      </header>
      <main className="team-invite-card">
        <Icon name="users" size={32} />
        {invitation.error ? (
          <ResourceFailure
            error={invitation.error}
            onRetry={invitation.refresh}
          />
        ) : !invitation.data ? (
          <p role="status">{t("Loading invitation…")}</p>
        ) : (
          <>
            <h1>{t("Join {team}", { team: invitation.data.teamName })}</h1>
            <p>
              {t(
                "Join this shared workspace. Members can access and edit each other’s presentations, activities, practice and reports.",
              )}
            </p>
            <p className="team-invite-identity">
              {t("Invited email")}: <strong>{invitation.data.email}</strong>
            </p>
            {user ? (
              <>
                <p>
                  {t("Signed in as {name}", { name: user.name })}
                  <br />
                  {user.email || t("Exploration account")}
                </p>
                <ErrorNote message={error} />
                <button
                  className="button primary full"
                  disabled={
                    busy ||
                    user.email.toLowerCase() !== invitation.data.email ||
                    user.role !== "teacher"
                  }
                  onClick={async () => {
                    if (busy) return;
                    setBusy(true);
                    setError("");
                    try {
                      await join();
                    } catch (e) {
                      setError((e as Error).message);
                      setBusy(false);
                    }
                  }}
                >
                  {t(busy ? "Joining…" : "Join team")}
                  <Icon name="arrow" size={18} />
                </button>
                {(user.email.toLowerCase() !== invitation.data.email ||
                  user.role !== "teacher") && (
                  <p>
                    {t(
                      "Sign in with the invited workspace account to continue.",
                    )}
                  </p>
                )}
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setError("");
                    try {
                      await api("auth", undefined, "DELETE");
                      setUser(undefined);
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {t("Switch account")}
                </button>
              </>
            ) : (
              <form
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (busy) return;
                  setBusy(true);
                  setError("");
                  const form = new FormData(event.currentTarget);
                  try {
                    const result = await api<{ user: User }>("auth", {
                      action: register ? "register" : "login",
                      name: form.get("name"),
                      email: invitation.data!.email,
                      password: form.get("password"),
                      role: "teacher",
                    });
                    setUser(result.user);
                    await join();
                  } catch (e) {
                    setError((e as Error).message);
                    setBusy(false);
                  }
                }}
              >
                {register && (
                  <label>
                    {t("Full name")}
                    <input
                      name="name"
                      autoComplete="name"
                      required
                      maxLength={80}
                      disabled={busy}
                    />
                  </label>
                )}
                <label>
                  {t("Email")}
                  <input
                    type="email"
                    autoComplete="email"
                    value={invitation.data.email}
                    readOnly
                  />
                </label>
                <label>
                  {t("Password")}
                  <input
                    type="password"
                    name="password"
                    autoComplete={
                      register ? "new-password" : "current-password"
                    }
                    minLength={8}
                    maxLength={128}
                    required
                    disabled={busy}
                  />
                </label>
                <ErrorNote message={error} />
                <button className="button primary full" disabled={busy}>
                  {t(
                    busy
                      ? "Joining…"
                      : register
                        ? "Create account and join"
                        : "Log in and join",
                  )}
                  <Icon name="arrow" size={18} />
                </button>
                <p className="auth-switch">
                  {t(
                    register
                      ? "Already have an account?"
                      : "Don’t have an account?",
                  )}{" "}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setRegister(!register);
                      setError("");
                    }}
                  >
                    {t(register ? "Log in" : "Create account")}
                  </button>
                </p>
              </form>
            )}
          </>
        )}
      </main>
    </div>
  );
}

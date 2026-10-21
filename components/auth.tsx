"use client";
import { ThemeMenu } from "./theme-menu";
import Link from "next/link";
import { useProductLocale as useLocale } from "./product-locale";
import { useState } from "react";
import type { User } from "@/lib/types";
import { Logo, Icon, ErrorNote, api } from "./ui";

export function Auth({
  onDone,
  participant = false,
  initialRegister = participant,
  onBack,
}: {
  onDone: (user: User) => void;
  participant?: boolean;
  initialRegister?: boolean;
  onBack?: () => void;
}) {
  const { t } = useLocale();

  const [register, setRegister] = useState(initialRegister),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const data = await api(participant ? "participant/auth" : "auth", {
        action: register ? "register" : "login",
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        role: participant ? "participant" : "teacher",
      });
      onDone(data.user);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function demo() {
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      const data = await api("auth", { action: "demo" });
      onDone(data.user);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-screen">
      <header>
        <Link href="/" aria-label={t("LİNBA home")}>
          <Logo />
        </Link>
        <div className="auth-header-actions">
          <span className="muted">
            {t("With you at every stage of training.")}
          </span>
          <ThemeMenu />
        </div>
      </header>
      <main className="auth-layout">
        <div className="auth-copy">
          <p className="auth-statement">
            {t(participant ? "Your training." : "Your AI agents.")}
            <br />
            {t(participant ? "Your questions." : "At every step")}
            <br />
            <span>
              {t(participant ? "Your learning." : "of your training.")}
            </span>
          </p>
        </div>
        <section className="auth-form">
          {participant && onBack && (
            <button
              type="button"
              className="text-button"
              onClick={onBack}
              disabled={busy}
            >
              <Icon name="back" size={16} />
              {t("Join without an account")}
            </button>
          )}
          <h1>
            {t(
              participant
                ? register
                  ? "Join your training"
                  : "Sign in to join training"
                : "Beta tester sign-in",
            )}
          </h1>
          <p className="muted">
            {t(
              participant
                ? register
                  ? "Create a participant account to join with your instructor’s code."
                  : "Sign in with your participant account. Your training link stays here."
                : "Sign in with your existing beta account to return to your workspace.",
            )}
          </p>
          <form onSubmit={submit}>
            {register && (
              <label>
                {t("Full name")}
                <input
                  name="name"
                  autoComplete="name"
                  placeholder={t("Your full name")}
                  required
                  maxLength={80}
                  disabled={busy}
                />
              </label>
            )}
            <label>
              {t("Email")}
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder={t("you@example.com")}
                required
                maxLength={254}
                disabled={busy}
              />
            </label>
            <label>
              {t("Password")}
              <input
                name="password"
                type="password"
                autoComplete={register ? "new-password" : "current-password"}
                placeholder={t("At least 8 characters")}
                minLength={8}
                maxLength={128}
                required
                disabled={busy}
              />
            </label>
            <ErrorNote message={error} />
            <button className="button primary full" disabled={busy}>
              {busy
                ? t("Please wait…")
                : register
                  ? t("Create account")
                  : t("Log in")}
              <Icon name="arrow" />
            </button>
          </form>
          <p className="auth-switch">
            {register
              ? t("Already have an account?")
              : t("Don’t have an account?")}{" "}
            {participant ? (
              <button
                disabled={busy}
                onClick={() => {
                  setError("");
                  setRegister(!register);
                }}
              >
                {t(register ? "Log in" : "Create participant account")}
              </button>
            ) : (
              <Link href="/login">{t("Join the waitlist")}</Link>
            )}
          </p>
          {!participant && (
            <>
              <div className="or">
                <span>{t("or")}</span>
              </div>
              <button className="button full" disabled={busy} onClick={demo}>
                <Icon name="eye" />
                {t("Experience LİNBA agents")}
              </button>
              <p className="small muted center">
                {t("Free to explore. No account needed.")}
              </p>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

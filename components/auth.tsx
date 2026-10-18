"use client";
import { ThemeMenu } from "./theme-menu";
import Link from "next/link";
import { useLocale } from "./locale-provider";
import { useState } from "react";
import type { User } from "@/lib/types";
import { Logo, Icon, ErrorNote, api } from "./ui";

export function Auth({
  onDone,
  participant = false,
  initialRegister = true,
}: {
  onDone: (user: User) => void;
  participant?: boolean;
  initialRegister?: boolean;
}) {
  const { t } = useLocale();

  const [register, setRegister] = useState(initialRegister),
    [role, setRole] = useState(participant ? "participant" : "teacher"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const data = await api("auth", {
        action: register ? "register" : "login",
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        role,
      });
      onDone(data.user);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function demo() {
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
      <div className="auth-layout">
        <div className="auth-copy">
          <h1>
            {t("Your AI agents.")}
            <br />
            {t("At every step")}
            <br />
            <span>{t("of your training.")}</span>
          </h1>
        </div>
        <section className="auth-form">
          <h2>{register ? t("Welcome to LİNBA") : t("Welcome back")}</h2>
          <p className="muted">
            {register
              ? t("Create an account and open your workspace.")
              : t("Pick up where you left off.")}
          </p>
          {register && (
            <div className="segmented">
              {["teacher", "participant"].map((r) => (
                <button
                  key={r}
                  className={role === r ? "active" : ""}
                  onClick={() => setRole(r)}
                >
                  <Icon name={r === "teacher" ? "presentation" : "users"} />
                  {r === "teacher" ? t("Instructor") : t("Participant")}
                </button>
              ))}
            </div>
          )}
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
            <button onClick={() => setRegister(!register)}>
              {register ? t("Log in") : t("Create account")}
            </button>
          </p>
          {!participant && (
            <>
              <div className="or">
                <span>{t("or")}</span>
              </div>
              <button className="button full" disabled={busy} onClick={demo}>
                <Icon name="eye" />
                {t("Try a sample training")}
              </button>
              <p className="small muted center">
                {t("A private workspace will be created for you.")}
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Auth } from "./auth";
import { useProductLocale as useLocale } from "./product-locale";
import { ThemeMenu } from "./theme-menu";
import { api, ErrorNote, Icon, Logo } from "./ui";
import "./access-entry.css";

export function AuthEntry({ login = false }: { login?: boolean }) {
  const { locale, t } = useLocale();
  const [email, setEmail] = useState("");
  const [registered, setRegistered] = useState(false);
  const [joining, setJoining] = useState(false);
  const [experiencing, setExperiencing] = useState(false);
  const [error, setError] = useState("");
  const [experienceError, setExperienceError] = useState("");

  async function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (joining) return;
    setJoining(true);
    setError("");
    try {
      await api("public-waitlist", { email, locale });
      setRegistered(true);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setJoining(false);
    }
  }

  async function experience() {
    if (experiencing) return;
    setExperiencing(true);
    setExperienceError("");
    try {
      await api("auth", { action: "demo" });
      window.location.assign("/");
    } catch (error) {
      setExperienceError((error as Error).message);
      setExperiencing(false);
    }
  }

  if (login)
    return (
      <Auth
        initialRegister={false}
        onDone={() => window.location.assign("/")}
      />
    );

  return (
    <div className="access-page">
      <header className="access-header">
        <Link href="/explore" aria-label={t("LİNBA home")}>
          <Logo />
        </Link>
        <div>
          <ThemeMenu />
        </div>
      </header>
      <main className="access-layout">
        <section
          className="access-invitation"
          aria-labelledby="access-waitlist-title"
        >
          {registered ? (
            <div className="access-confirmation" role="status">
              <span className="access-confirmation-icon">
                <Icon name="check" size={28} />
              </span>
              <h1 id="access-waitlist-title">{t("You’re on the list.")}</h1>
              <p>
                {t("You’ll be among the first to know when LİNBA launches.")}
              </p>
              <span className="access-saved-email">{email}</span>
              <button
                className="access-text-action"
                onClick={() => setRegistered(false)}
              >
                {t("Use a different email")}
              </button>
            </div>
          ) : (
            <>
              <h1 id="access-waitlist-title">
                {t("Be among the first to know.")}
              </h1>
              <p>
                {t(
                  "LİNBA is launching soon. Join the list and we’ll let you know when it’s ready.",
                )}
              </p>
              <form className="access-waitlist-form" onSubmit={join}>
                <label htmlFor="access-email">{t("Your email address")}</label>
                <input
                  id="access-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t("you@example.com")}
                  maxLength={254}
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={joining}
                />
                <ErrorNote message={error} />
                <button
                  className="button primary access-join"
                  disabled={joining}
                >
                  {t(joining ? "Saving…" : "Join the waitlist")}
                  <Icon name={joining ? "spinner" : "arrow"} size={19} />
                </button>
              </form>
              <p className="access-note">
                {t("Only updates about LİNBA’s launch and new features.")}
              </p>
            </>
          )}
          <p className="access-existing">
            {t("Are you a beta tester?")}{" "}
            <Link href="/login?mode=signin">{t("Log in")}</Link>
          </p>
        </section>
        <section className="access-experience" aria-labelledby="access-title">
          <h2 id="access-title">{t("Experience LİNBA in action.")}</h2>
          <p>
            {t(
              "Try LİNBA’s AI agents in a sample training. Practice, interact and explore learning support.",
            )}
          </p>
          <ErrorNote message={experienceError} />
          <button
            className="button access-experience-button"
            disabled={experiencing}
            onClick={experience}
          >
            {t(
              experiencing
                ? "Preparing your experience…"
                : "Experience LİNBA agents",
            )}
            <Icon
              name={experiencing ? "spinner" : "arrow"}
              size={19}
              className={experiencing ? "spin" : undefined}
            />
          </button>
          <p className="access-experience-note">
            {t("A private workspace will be created for you.")}
          </p>
          <p className="access-experience-note">
            {t("Free to explore. No account needed.")}{" "}
            {t("Access lasts up to 7 days in this browser.")}
          </p>
        </section>
      </main>
      <footer className="access-footer">
        <span>© {new Date().getFullYear()} LİNBA</span>
        <span>{t("AI agents for education.")}</span>
      </footer>
    </div>
  );
}

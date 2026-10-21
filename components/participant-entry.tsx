"use client";
import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@/lib/types";
import { useProductLocale as useLocale } from "./product-locale";
import { Auth } from "./auth";
import { ThemeMenu } from "./theme-menu";
import { api, Logo, Icon, ErrorNote } from "./ui";

export function ParticipantEntry({
  initialCode,
  onJoin,
  onSignedIn,
}: {
  initialCode: string;
  onJoin: (id: string, user: User) => void;
  onSignedIn: () => void;
}) {
  const { t } = useLocale();
  const [account, setAccount] = useState(false);
  const [code, setCode] = useState(initialCode.trim());
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const codeFromLink = /^\d{6}$/u.test(initialCode.trim());
  useEffect(() => {
    setCode(initialCode.trim());
  }, [initialCode]);
  if (account)
    return (
      <Auth
        participant
        initialRegister={false}
        onDone={onSignedIn}
        onBack={() => setAccount(false)}
      />
    );
  async function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await api<{ id: string; user: User }>("participant/join", {
        asGuest: true,
        code,
        nickname,
      });
      onJoin(result.id, result.user);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="participant-entry">
      <header>
        <a href="/" aria-label={t("LİNBA home")}>
          <Logo />
        </a>
        <ThemeMenu />
      </header>
      <main className="participant-entry-content">
        <div className="participant-entry-intro">
          <h1>{t("Join training")}</h1>
          <p>{t("Enter your name to join. No account needed.")}</p>
        </div>
        <form
          className="participant-entry-form"
          onSubmit={join}
          aria-busy={busy}
        >
          {!codeFromLink && (
            <>
              <label htmlFor="participant-code">{t("Training code")}</label>
              <input
                id="participant-code"
                name="code"
                className="participant-entry-code"
                inputMode="numeric"
                autoComplete="off"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                required
                placeholder={t("6-digit code")}
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/gu, "").slice(0, 6))
                }
                disabled={busy}
              />
            </>
          )}
          <label htmlFor="participant-name">{t("Participant name")}</label>
          <input
            id="participant-name"
            name="nickname"
            autoComplete="name"
            minLength={2}
            maxLength={40}
            required
            placeholder={t("Enter your name")}
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            aria-describedby="participant-name-hint"
            disabled={busy}
          />
          <p id="participant-name-hint" className="participant-entry-hint">
            {t("Your name appears in the presentation and reports.")}
          </p>
          <ErrorNote message={error} />
          <button
            className="button primary full"
            disabled={busy || code.length !== 6 || nickname.trim().length < 2}
          >
            {t(busy ? "Joining your training…" : "Join presentation")}
            <Icon
              name={busy ? "spinner" : "arrow"}
              className={busy ? "spin" : ""}
              size={18}
            />
          </button>
        </form>
        <div className="participant-entry-account">
          <span>{t("Already have an account?")}</span>
          <button
            className="text-button"
            disabled={busy}
            onClick={() => setAccount(true)}
          >
            {t("Sign in with your account")}
            <Icon name="arrow" size={16} />
          </button>
        </div>
      </main>
    </div>
  );
}

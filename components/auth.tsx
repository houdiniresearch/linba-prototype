"use client";
import { ThemeMenu } from "./theme-menu";
import { useLocale } from "./locale-provider";
import { useState } from "react";
import type { User } from "@/lib/types";
import { Logo, Icon, ErrorNote, api } from "./ui";

export function Auth({
  onDone,
  participant = false,
}: {
  onDone: (user: User) => void;
  participant?: boolean;
}) {
  const { t } = useLocale();

  const [register, setRegister] = useState(true),
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
        <Logo />
        <div className="auth-header-actions">
          <span className="muted">{t("Eğitimin her aşamasında yanında.")}</span>
          <ThemeMenu />
        </div>
      </header>
      <div className="auth-layout">
        <div className="auth-copy">
          <span className="eyebrow">
            {t("EĞİTMEN VE KATILIMCI ÇALIŞMA ALANI")}
          </span>
          <h1>
            {t("Hazırla.")}
            <br />
            {t("Birlikte öğren.")}
            <br />
            <span>{t("Öğrenmeyi sürdür.")}</span>
          </h1>
          <p>
            {t(
              "Sunumun, etkileşimli aktivitelerin ve dokümanına dayanan bir öğrenme asistanın. Hepsi aynı eğitimde.",
            )}
          </p>
          <div className="auth-preview">
            <Icon name="presentation" size={36} />
            <div>
              <strong>{t("Sunumdan eğitime")}</strong>
              <span>{t("Önce dokümanını yükle. Gerisi eğitiminde.")}</span>
            </div>
          </div>
        </div>
        <section className="auth-form">
          <h2>
            {register ? t("LİNBA’ya hoş geldin") : t("Tekrar hoş geldin")}
          </h2>
          <p className="muted">
            {register
              ? t("Hesabını oluştur, çalışma alanına geç.")
              : t("Eğitimlerine kaldığın yerden devam et.")}
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
                  {r === "teacher" ? t("Eğitmen") : t("Katılımcı")}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={submit}>
            {register && (
              <label>
                {t("Ad soyad")}
                <input
                  name="name"
                  autoComplete="name"
                  placeholder={t("Adın ve soyadın")}
                  required
                  maxLength={80}
                />
              </label>
            )}
            <label>
              {t("E-posta")}
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder={t("sen@ornek.com")}
                required
              />
            </label>
            <label>
              {t("Şifre")}
              <input
                name="password"
                type="password"
                autoComplete={register ? "new-password" : "current-password"}
                placeholder={t("En az 8 karakter")}
                minLength={8}
                maxLength={128}
                required
              />
            </label>
            <ErrorNote message={error} />
            <button className="button primary full" disabled={busy}>
              {busy
                ? t("Biraz bekle…")
                : register
                  ? t("Hesap oluştur")
                  : t("Giriş yap")}
              <Icon name="arrow" />
            </button>
          </form>
          <p className="auth-switch">
            {register ? t("Zaten hesabın var mı?") : t("Henüz hesabın yok mu?")}{" "}
            <button onClick={() => setRegister(!register)}>
              {register ? t("Giriş yap") : t("Hesap oluştur")}
            </button>
          </p>
          {!participant && (
            <>
              <div className="or">
                <span>{t("veya")}</span>
              </div>
              <button className="button full" disabled={busy} onClick={demo}>
                <Icon name="eye" />
                {t("Örnek eğitimle dene")}
              </button>
              <p className="small muted center">
                {t("Sana özel bir deneme alanı açılır.")}
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

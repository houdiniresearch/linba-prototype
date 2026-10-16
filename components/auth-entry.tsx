"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Auth } from "./auth";
import { useLocale } from "./locale-provider";
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
        <Link href="/kesfet" aria-label={t("LİNBA ana sayfa")}>
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
              <h1 id="access-waitlist-title">{t("Listedesin.")}</h1>
              <p>
                {t(
                  "LİNBA kullanıma açıldığında ilk haberdar olanlardan olacaksın.",
                )}
              </p>
              <span className="access-saved-email">{email}</span>
              <button
                className="access-text-action"
                onClick={() => setRegistered(false)}
              >
                {t("Farklı bir e-posta kullan")}
              </button>
            </div>
          ) : (
            <>
              <h1 id="access-waitlist-title">
                {t("İlk haberdar olanlardan ol.")}
              </h1>
              <p>
                {t(
                  "LİNBA yakında kullanıma açılıyor. Yerini al, açılış haberini sana iletelim.",
                )}
              </p>
              <form className="access-waitlist-form" onSubmit={join}>
                <label htmlFor="access-email">{t("E-posta adresin")}</label>
                <input
                  id="access-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t("sen@ornek.com")}
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
                  {t(joining ? "Kaydediliyor…" : "Bekleme listesine katıl")}
                  <Icon name={joining ? "spinner" : "arrow"} size={19} />
                </button>
              </form>
              <p className="access-note">
                {t("Yalnızca LİNBA’nın açılışı ve yenilikleri hakkında.")}
              </p>
            </>
          )}
          <p className="access-existing">
            {t("Zaten hesabın var mı?")}{" "}
            <Link href="/giris?mod=giris">{t("Giriş yap")}</Link>
          </p>
        </section>
        <section className="access-experience" aria-labelledby="access-title">
          <h2 id="access-title">{t("LİNBA’yı deneyimle.")}</h2>
          <p>
            {t(
              "Örnek bir eğitimde LİNBA’nın yapay zekâ ajanlarını dene. Pratik yap, etkileşim kur ve öğrenme desteğini keşfet.",
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
                ? "Deneyimin hazırlanıyor…"
                : "LİNBA ajanlarını deneyimle",
            )}
            <Icon name={experiencing ? "spinner" : "arrow"} size={19} />
          </button>
          <p className="access-experience-note">
            {t("Ücretsiz. Hesap oluşturmadan.")}
          </p>
        </section>
      </main>
      <footer className="access-footer">
        <span>© {new Date().getFullYear()} LİNBA</span>
        <span>{t("Eğitim için yapay zekâ ajanları.")}</span>
      </footer>
    </div>
  );
}

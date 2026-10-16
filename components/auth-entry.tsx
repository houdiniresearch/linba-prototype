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
          <Link className="access-back" href="/kesfet">
            <Icon name="back" size={16} />
            {t("LİNBA’yı keşfet")}
          </Link>
          <ThemeMenu />
        </div>
      </header>
      <main className="access-layout">
        <section className="access-story" aria-labelledby="access-title">
          <div className="access-story-copy">
            <span className="access-launch">
              <span aria-hidden="true" />
              {t("Yeni bir öğrenme deneyimi, çok yakında.")}
            </span>
            <h1 id="access-title">
              {t("Eğitiminin her anında,")}
              <br />
              <span>{t("yanında bir ajan.")}</span>
            </h1>
            <p>
              {t(
                "Hazırlığından öğrenme sonuçlarına, LİNBA’nın yapay zekâ ajanlarıyla tanış.",
              )}
            </p>
          </div>
          <div className="access-art">
            <img
              src="/landing/hero-learning-space.webp"
              width={1024}
              height={768}
              alt={t(
                "Eğitim, katılım ve öğrenmeyi bir araya getiren LİNBA ajanlarının izometrik görünümü",
              )}
              fetchPriority="high"
            />
          </div>
          <div className="access-agent-roles" aria-label={t("LİNBA ajanları")}>
            <span>
              <Icon name="mic" size={19} />
              {t("Birlikte pratik yap.")}
            </span>
            <span>
              <Icon name="chat" size={19} />
              {t("Katılımı güçlendir.")}
            </span>
            <span>
              <Icon name="chart" size={19} />
              {t("Öğrenmeyi anla.")}
            </span>
          </div>
        </section>
        <section
          className="access-invitation"
          aria-labelledby="access-waitlist-title"
        >
          {registered ? (
            <div className="access-confirmation" role="status">
              <span className="access-confirmation-icon">
                <Icon name="check" size={28} />
              </span>
              <h2 id="access-waitlist-title">{t("Listedesin.")}</h2>
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
              <span className="access-section-label">
                {t("Bekleme listesi")}
              </span>
              <h2 id="access-waitlist-title">
                {t("İlk haberdar olanlardan ol.")}
              </h2>
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
          <div className="access-experience">
            <div className="access-experience-heading">
              <Icon name="sparkle" size={22} />
              <h3>{t("Beklerken, ajanlarla tanış.")}</h3>
            </div>
            <p>
              {t(
                "Örnek bir eğitimde LİNBA ajanlarını ücretsiz deneyimle. Hesap oluşturman gerekmez.",
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
          </div>
          <p className="access-existing">
            {t("Zaten hesabın var mı?")}{" "}
            <Link href="/giris?mod=giris">{t("Giriş yap")}</Link>
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

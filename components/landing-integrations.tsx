"use client";

import { useRef, useState } from "react";
import { integrations, type IntegrationId } from "@/lib/integrations";
import { useLocale } from "./locale-provider";
import { api, ErrorNote, Icon, Logo, Modal } from "./ui";

function IntegrationLogo({
  id,
  size = 32,
}: {
  id: IntegrationId;
  size?: number;
}) {
  return id === "chatgpt" ? (
    <span className="integration-chatgpt-symbol" aria-hidden="true" />
  ) : (
    <img
      src={`/integrations/${id}.${id === "zoom" ? "png" : "svg"}`}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      loading="lazy"
    />
  );
}

export function LandingIntegrations() {
  const { locale, t } = useLocale();
  const [selected, setSelected] = useState<
    (typeof integrations)[number] | null
  >(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || busy) return;
    setBusy(true);
    setError("");
    try {
      await api("integration-waitlist", {
        integration: selected.id,
        email,
        locale,
      });
      setRegistered(true);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section
        id="entegrasyonlar"
        className="landing-integrations landing-container"
        aria-labelledby="integrations-title"
      >
        <h2 id="integrations-title">{t("Çalıştığın araçlarla birlikte.")}</h2>
        <p>{t("Planlanan entegrasyonlar için bekleme listesine katıl.")}</p>
        <div className="landing-integration-list">
          {integrations.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-haspopup="dialog"
              aria-label={t("{name} için bekleme listesine katıl", {
                name: item.name,
              })}
              onClick={(event) => {
                trigger.current = event.currentTarget;
                setSelected(item);
                setRegistered(false);
                setError("");
              }}
            >
              <IntegrationLogo id={item.id} />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      </section>
      <Modal
        returnFocusRef={trigger}
        open={!!selected}
        onClose={() => {
          if (!busy) setSelected(null);
        }}
        closeDisabled={busy}
        className="waitlist-modal integration-waitlist-modal"
        title={
          <span className="waitlist-heading">
            <span className="integration-connection" aria-hidden="true">
              <Logo />
              <span className="integration-connection-link">
                <Icon name={registered ? "check" : "link"} size={36} />
              </span>
              <span className="waitlist-emblem">
                {selected && <IntegrationLogo id={selected.id} size={32} />}
              </span>
            </span>
            <span>
              {t(
                registered
                  ? "Bekleme listesindesin"
                  : "Bekleme listesine katıl",
              )}
            </span>
          </span>
        }
        description={
          selected
            ? t(
                registered
                  ? "{name} için talebin kaydedildi."
                  : "{name} entegrasyonu henüz kullanıma açık değil. Hazır olduğunda haber almak için e-postanı bırak.",
                { name: selected.name },
              )
            : undefined
        }
      >
        {registered ? (
          <div className="waitlist-confirmation" role="status">
            <div className="waitlist-email-record">
              <Icon name="send" size={21} />
              <div>
                <span>{t("Kayıtlı e-posta adresin")}</span>
                <strong>{email.trim().toLowerCase()}</strong>
              </div>
            </div>
            <div className="waitlist-confirmation-actions">
              <button className="button mint" onClick={() => setSelected(null)}>
                {t("Tamam")}
                <Icon name="check" size={18} />
              </button>
            </div>
          </div>
        ) : (
          <form className="waitlist-form" onSubmit={submit}>
            <label>
              {t("E-posta adresin")}
              <input
                type="email"
                autoFocus
                name="email"
                autoComplete="email"
                required
                maxLength={254}
                disabled={busy}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("sen@ornek.com")}
              />
            </label>
            <ErrorNote message={error} />
            <button className="button primary full" disabled={busy}>
              {busy && <Icon name="spinner" className="spin" size={18} />}
              {t(busy ? "Kaydediliyor…" : "Bekleme listesine katıl")}
              {!busy && <Icon name="arrow" size={19} />}
            </button>
            <p className="waitlist-footnote">
              {t("Yalnızca seçtiğin entegrasyonla ilgili haberler için.")}
            </p>
          </form>
        )}
      </Modal>
    </>
  );
}

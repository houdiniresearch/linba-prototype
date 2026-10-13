"use client";
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
        <span className="muted">Eğitimin her aşamasında yanında.</span>
      </header>
      <div className="auth-layout">
        <div className="auth-copy">
          <span className="eyebrow">EĞİTMEN VE KATILIMCI ÇALIŞMA ALANI</span>
          <h1>
            Hazırla.
            <br />
            Birlikte öğren.
            <br />
            <span>Öğrenmeyi sürdür.</span>
          </h1>
          <p>
            Sunumun, etkileşimli aktivitelerin ve dokümanına dayanan bir öğrenme
            asistanın. Hepsi aynı eğitimde.
          </p>
          <div className="auth-preview">
            <Icon name="presentation" size={36} />
            <div>
              <strong>Sunumdan eğitime</strong>
              <span>Önce dokümanını yükle. Gerisi eğitiminde.</span>
            </div>
          </div>
        </div>
        <section className="auth-form">
          <h2>{register ? "LİNBA’ya hoş geldin" : "Tekrar hoş geldin"}</h2>
          <p className="muted">
            {register
              ? "Hesabını oluştur, çalışma alanına geç."
              : "Eğitimlerine kaldığın yerden devam et."}
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
                  {r === "teacher" ? "Eğitmen" : "Katılımcı"}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={submit}>
            {register && (
              <label>
                Ad soyad
                <input
                  name="name"
                  autoComplete="name"
                  placeholder="Adın ve soyadın"
                  required
                  maxLength={80}
                />
              </label>
            )}
            <label>
              E-posta
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="sen@ornek.com"
                required
              />
            </label>
            <label>
              Şifre
              <input
                name="password"
                type="password"
                autoComplete={register ? "new-password" : "current-password"}
                placeholder="En az 8 karakter"
                minLength={8}
                maxLength={128}
                required
              />
            </label>
            <ErrorNote message={error} />
            <button className="button primary full" disabled={busy}>
              {busy ? "Biraz bekle…" : register ? "Hesap oluştur" : "Giriş yap"}
              <Icon name="arrow" />
            </button>
          </form>
          <p className="auth-switch">
            {register ? "Zaten hesabın var mı?" : "Henüz hesabın yok mu?"}{" "}
            <button onClick={() => setRegister(!register)}>
              {register ? "Giriş yap" : "Hesap oluştur"}
            </button>
          </p>
          {!participant && (
            <>
              <div className="or">
                <span>veya</span>
              </div>
              <button className="button full" disabled={busy} onClick={demo}>
                <Icon name="eye" />
                Örnek eğitimle dene
              </button>
              <p className="small muted center">
                Sana özel bir deneme alanı açılır.
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

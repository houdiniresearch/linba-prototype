"use client";
import { useEffect, useRef, useState } from "react";
import type { CourseState, User } from "@/lib/types";
import { Auth } from "./auth";
import { JoinForm } from "./dashboard";
import { api, useResource, Icon, Logo, Loading, ErrorNote, Empty } from "./ui";

export function Participant() {
  const auth = useResource<{ user?: User }>("auth");
  const [id, setId] = useState(""),
    [code, setCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setId(p.get("egitim") || "");
    setCode(p.get("kod") || "");
  }, []);
  useEffect(() => {
    if (auth.data?.user?.role === "participant" && code && !id) {
      let active = true;
      setJoining(true);
      setJoinError("");
      api("join", { code })
        .then((r) => {
          if (active) {
            setJoining(false);
            setId(r.id);
            history.replaceState(null, "", `/katil?egitim=${r.id}`);
          }
        })
        .catch((error: Error) => {
          if (active) setJoinError(error.message);
        })
        .finally(() => {
          if (active) setJoining(false);
        });
      return () => {
        active = false;
      };
    }
  }, [auth.data?.user?.id, auth.data?.user?.role, code, id]);
  if (!auth.data)
    return (
      <>
        <ErrorNote message={auth.error} />
        {!auth.error && <Loading />}
        {auth.error && (
          <button className="button" onClick={() => void auth.refresh()}>
            Yeniden dene
          </button>
        )}
      </>
    );
  if (!auth.data.user)
    return (
      <Auth
        participant
        onDone={() => {
          void auth.refresh();
        }}
      />
    );
  if (auth.data.user.role !== "participant")
    return (
      <div className="participant-gate">
        <Logo />
        <h1>Katılımcı hesabıyla giriş yap</h1>
        <p className="muted">
          Bu tarayıcıda eğitmen hesabın açık. Katılımcı görünümünü farklı bir
          tarayıcıda veya telefonda açabilirsin.
        </p>
        <a className="button" href="/">
          Eğitmen alanına dön
        </a>
        <button
          className="text-button"
          onClick={async () => {
            await api("auth", undefined, "DELETE");
            await auth.refresh();
          }}
        >
          Bu hesaptan çıkış yap
        </button>
      </div>
    );
  if (!id && joining) return <Loading label="Eğitimine katılıyorsun…" />;
  if (!id)
    return (
      <div className="participant-gate">
        <Logo />
        <h1>Eğitime katıl</h1>
        <p className="muted">
          Merhaba {auth.data.user.name}. Eğitmeninin paylaştığı kodu yaz.
        </p>
        <ErrorNote message={joinError} />
        <JoinForm
          initialCode={code}
          onJoin={(id) => {
            setJoinError("");
            setJoining(false);
            setId(id);
            history.replaceState(null, "", `/katil?egitim=${id}`);
          }}
        />
        <a className="text-button" href="/">
          Eğitimlerime dön
        </a>
      </div>
    );
  return (
    <ParticipantCourse
      id={id}
      user={auth.data.user}
      onLeave={() => {
        setId("");
        setCode("");
        setJoinError("");
        setJoining(false);
        history.replaceState(null, "", "/katil");
      }}
    />
  );
}
function ParticipantCourse({
  id,
  user,
  onLeave,
}: {
  id: string;
  user: User;
  onLeave: () => void;
}) {
  const { data, error, refresh } = useResource<CourseState>(
    `courses/${id}`,
    1600,
  );
  const [tab, setTab] = useState("chat"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [value, setValue] = useState(""),
    [sending, setSending] = useState(false),
    [source, setSource] = useState(0);
  const bottom = useRef<HTMLDivElement>(null),
    version = useRef(-1);
  const course = data?.course,
    active = course?.slides.find((s) => s.id === course.activeSlideId);
  useEffect(() => {
    if (!course) return;
    if (
      course.status === "live" &&
      active?.kind === "activity" &&
      course.slideVersion !== version.current
    )
      setTab("activities");
    if (course.status === "ended") setTab("chat");
    version.current = course.slideVersion;
  }, [course?.slideVersion, course?.status, active?.kind]);
  useEffect(() => {
    setValue("");
    setNotice("");
  }, [active?.id]);
  useEffect(() => {
    if (tab === "chat")
      bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [
    data?.questions.length,
    data?.questions.map((q) => q.status).join(),
    tab,
  ]);
  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || busy) return;
    setBusy(true);
    setNotice("");
    const text = message;
    setMessage("");
    try {
      await api(`courses/${id}/questions`, { text });
      await refresh();
    } catch (e) {
      setNotice((e as Error).message);
      setMessage(text);
    } finally {
      setBusy(false);
    }
  }
  if (!data)
    return (
      <div className="participant-gate">
        <Logo />
        <ErrorNote message={error} />
        {!error && <Loading />}
        {error && (
          <button className="button" onClick={onLeave}>
            Başka eğitime katıl
          </button>
        )}
      </div>
    );
  const c = data.course,
    ended = c.status === "ended",
    expiry = c.endedAt ? Date.parse(c.endedAt) + c.accessDays * 86400000 : 0,
    remaining = expiry
      ? Math.max(0, Math.ceil((expiry - Date.now()) / 86400000))
      : 0,
    chatOpen = c.status === "live" || (ended && remaining > 0),
    submitted = data.responses.find((r) => r.slideId === active?.id);
  return (
    <div className="participant-app">
      <header>
        <button
          className="icon-button"
          aria-label="Eğitimden çık"
          onClick={onLeave}
        >
          <Icon name="back" />
        </button>
        <Logo />
        <span className="avatar">{user.name.slice(0, 1)}</span>
      </header>
      <div className="participant-course-title">
        <div>
          <h1>{c.name}</h1>
          <span className="small muted">
            {c.status === "live" ? (
              <>
                <span className="live-dot" />
                Canlı eğitim
              </>
            ) : ended ? (
              `Eğitim tamamlandı · Asistan erişimi: ${remaining} gün`
            ) : (
              "Eğitmenini bekliyorsun"
            )}
          </span>
        </div>
      </div>
      <nav className="participant-tabs">
        <button
          className={tab === "chat" ? "active" : ""}
          onClick={() => setTab("chat")}
        >
          <Icon name="chat" />
          Sohbet
        </button>
        <button
          className={tab === "activities" ? "active" : ""}
          onClick={() => setTab("activities")}
        >
          <Icon name="activity" />
          Aktiviteler
          {c.status === "live" && active?.kind === "activity" && <i />}
        </button>
      </nav>
      {tab === "chat" ? (
        <>
          <div className="chat-messages">
            <div className="chat-intro">
              <span className="assistant-avatar">
                <Icon name="sparkle" />
              </span>
              <h2>Sunumun içinden, soruna yanıt.</h2>
              <p>
                {chatOpen
                  ? "Bu eğitimin dokümanına ilişkin sorularını sorabilirsin. Yanıtın ve sohbetin sana özel."
                  : "Eğitmen eğitimi başlattığında burada soru sorabileceksin."}
              </p>
              {!c.autoAnswer && c.status === "live" && (
                <span className="small">
                  Bu eğitimde sorular doğrudan eğitmenine iletilir.
                </span>
              )}
            </div>
            {data.questions.map((q) => (
              <div className="chat-exchange" key={q.id}>
                <div className="chat-user">
                  <p>{q.text}</p>
                </div>
                <div
                  className={`chat-answer ${!q.answer && q.status !== "pending" ? "forward" : ""}`}
                >
                  <span className="chat-answer-label">
                    <Icon
                      name={
                        q.answer
                          ? "sparkle"
                          : q.status === "pending"
                            ? "spinner"
                            : "presentation"
                      }
                      className={q.status === "pending" ? "spin" : ""}
                      size={16}
                    />
                    {q.answer
                      ? "LİNBA asistan"
                      : q.status === "pending"
                        ? "Yanıt hazırlanıyor"
                        : "Eğitmenine iletildi"}
                  </span>
                  <p>
                    {q.answer ||
                      (q.status === "pending"
                        ? "Dokümanda yanıtın aranıyor…"
                        : "Sorun eğitmene iletildi.")}
                  </p>
                  {q.answer && q.sources.length > 0 && (
                    <div className="chat-sources">
                      {q.sources.map((n) => (
                        <button
                          key={n}
                          onClick={() => setSource(source === n ? 0 : n)}
                        >
                          <Icon name="file" size={14} />
                          Slayt {n}
                        </button>
                      ))}
                    </div>
                  )}
                  {q.addressed && (
                    <span className="small success-text">
                      <Icon name="check" size={14} />
                      Eğitmenin bu soruyu ele aldı.
                    </span>
                  )}
                </div>
              </div>
            ))}
            {source > 0 && (
              <div className="source-preview">
                <button
                  className="icon-button"
                  onClick={() => setSource(0)}
                  aria-label="Kaynağı kapat"
                >
                  <Icon name="close" />
                </button>
                <img
                  src={`/api/courses/${id}/page/${source}`}
                  alt={`Kaynak slayt ${source}`}
                />
              </div>
            )}
            <div ref={bottom} />
          </div>
          <div className="chat-input-area">
            <ErrorNote message={notice || error} />
            <form onSubmit={ask}>
              <textarea
                aria-label="Sorunu yaz"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  chatOpen
                    ? "Eğitimle ilgili sorunu yaz…"
                    : "Sohbet henüz açık değil"
                }
                disabled={!chatOpen}
                rows={1}
                maxLength={2000}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void ask(e);
                  }
                }}
              />
              <button
                className="send-button"
                disabled={!chatOpen || busy || !message.trim()}
                aria-label="Soruyu gönder"
              >
                <Icon
                  name={busy ? "spinner" : "send"}
                  className={busy ? "spin" : ""}
                />
              </button>
            </form>
            <small>
              Yanıtlar dokümanla sınırlıdır. Kaynakta bulunamayan sorular
              eğitmenine iletilir.
            </small>
          </div>
        </>
      ) : (
        <div className="participant-activity">
          {c.status === "live" && active?.activity ? (
            <>
              <span className="activity-label">
                <Icon name="activity" />
                AKTİF AKTİVİTE
              </span>
              <h2>{active.activity.question}</h2>
              {submitted ? (
                <div className="submitted">
                  <Icon name="success" size={40} />
                  <h3>Yanıtın gönderildi.</h3>
                  <p>{submitted.value}</p>
                  <span className="small muted">
                    Eğitmenin bir sonraki aktivitesini bekleyebilirsin.
                  </span>
                </div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSending(true);
                    setNotice("");
                    try {
                      await api(`courses/${id}/responses`, {
                        slideId: active.id,
                        value,
                      });
                      await refresh();
                    } catch (e) {
                      setNotice((e as Error).message);
                    } finally {
                      setSending(false);
                    }
                  }}
                >
                  {active.activity.type === "poll" ? (
                    <div className="participant-options">
                      {active.activity.options.map((o, i) => (
                        <label
                          key={i}
                          className={value === o ? "selected" : ""}
                        >
                          <input
                            type="radio"
                            name="option"
                            value={o}
                            checked={value === o}
                            onChange={() => setValue(o)}
                          />
                          <span>{String.fromCharCode(65 + i)}</span>
                          {o}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <label>
                      Yanıtın
                      <textarea
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="Düşünceni kendi sözlerinle paylaş…"
                        rows={6}
                        maxLength={3000}
                        required
                      />
                    </label>
                  )}
                  <ErrorNote message={notice} />
                  <button
                    className="button primary full"
                    disabled={sending || !value.trim()}
                  >
                    {sending ? "Gönderiliyor…" : "Yanıtımı gönder"}
                    <Icon name="send" />
                  </button>
                </form>
              )}
            </>
          ) : (
            <Empty
              icon="activity"
              title={
                ended ? "Eğitim tamamlandı" : "Bir sonraki aktiviteyi bekle"
              }
              description={
                ended
                  ? "Paylaştığın yanıtlar eğitmenin raporuna eklendi."
                  : "Eğitmenin aktivite slaytına geçtiğinde bu alan otomatik açılır."
              }
            />
          )}
          <div className="previous-responses">
            {data.responses.length > 0 && <h3>Gönderdiğin yanıtlar</h3>}
            {data.responses.map((r) => (
              <div key={r.id}>
                <span className="small muted">
                  {c.slides.find((s) => s.id === r.slideId)?.activity?.question}
                </span>
                <p>{r.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import type { Activity, Course, CourseState, Slide } from "@/lib/types";
import {
  api,
  Icon,
  Logo,
  Modal,
  Loading,
  ErrorNote,
  Status,
  useResource,
  Empty,
} from "./ui";
import { SlideView, slideTitle } from "./slides";

function ActivityEditor({
  course,
  slide,
  open,
  onClose,
  onSave,
}: {
  course: Course;
  slide?: Slide;
  open: boolean;
  onClose: () => void;
  onSave: (value: Activity) => Promise<void>;
}) {
  const [type, setType] = useState<Activity["type"]>(
      slide?.activity?.type || "poll",
    ),
    [question, setQuestion] = useState(slide?.activity?.question || ""),
    [options, setOptions] = useState(
      slide?.activity?.options.join("\n") || "Seçenek 1\nSeçenek 2",
    ),
    [ai, setAI] = useState(!!slide?.activity?.aiGenerated),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function generate() {
    setBusy(true);
    setError("");
    try {
      const active = course.slides.find((s) => s.id === course.activeSlideId);
      const result = await api(`courses/${course.id}/generate-activity`, {
        type,
        pageId: active?.pageId,
      });
      setType(result.activity.type);
      setQuestion(result.activity.question);
      setOptions(result.activity.options.join("\n"));
      setAI(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={slide ? "Aktiviteyi düzenle" : "Aktivite ekle"}
      description="Aktivite, seçili slayttan sonra sunum akışına yerleşir."
      wide
    >
      <div className="activity-dialog">
        <div>
          <div className="activity-type-list">
            {[
              ["poll", "chart", "Anket", "Seçenekler arasından yanıt alın."],
              [
                "open",
                "chat",
                "Açık uçlu soru",
                "Katılımcılar kendi sözleriyle yanıtlasın.",
              ],
              [
                "scenario",
                "activity",
                "Senaryo",
                "Bir durum üzerinden uygulama yapın.",
              ],
            ].map(([value, icon, title, desc]) => (
              <button
                className={type === value ? "selected" : ""}
                key={value}
                onClick={() => setType(value as Activity["type"])}
              >
                <Icon name={icon as "chart"} size={24} />
                <span>
                  <strong>{title}</strong>
                  <small>{desc}</small>
                </span>
                <Icon name="right" size={16} />
              </button>
            ))}
          </div>
          <button
            className="button ai-button"
            disabled={busy}
            onClick={generate}
          >
            <Icon name="sparkle" />
            {busy ? "Hazırlanıyor…" : "Bu slayttan AI ile hazırla"}
          </button>
          <p className="small muted">
            Dokümanındaki içerikten hazırlanır; kaydetmeden önce gözden
            geçirebilirsin.
          </p>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              await onSave({
                type,
                question,
                options:
                  type === "poll"
                    ? options
                        .split("\n")
                        .map((v) => v.trim())
                        .filter(Boolean)
                    : [],
                aiGenerated: ai,
              });
              onClose();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Aktivite sorusu
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Katılımcılarına ne sormak istersin?"
              rows={5}
              maxLength={3000}
              required
            />
          </label>
          {type === "poll" && (
            <label>
              Seçenekler
              <textarea
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                rows={4}
                required
              />
              <small>
                Her satıra bir seçenek yaz. En az 2, en fazla 6 seçenek.
              </small>
            </label>
          )}
          <ErrorNote message={error} />
          <button className="button primary full" disabled={busy}>
            <Icon name="check" />
            {slide ? "Değişiklikleri kaydet" : "Akışa ekle"}
          </button>
        </form>
      </div>
    </Modal>
  );
}

export function Editor({ id, live = false }: { id: string; live?: boolean }) {
  const router = useRouter(),
    resource = useResource<CourseState>(`courses/${id}`, live ? 1800 : 0),
    { data, error, setData, refresh } = resource;
  const [add, setAdd] = useState(false),
    [edit, setEdit] = useState(false),
    [settings, setSettings] = useState(false),
    [end, setEnd] = useState(false),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [drag, setDrag] = useState(""),
    [showJoin, setShowJoin] = useState(false),
    [joinBase, setJoinBase] = useState(""),
    [saving, setSaving] = useState(false);
  async function mutate(body: unknown) {
    setNotice("");
    setSaving(true);
    try {
      const result = await api<CourseState>(`courses/${id}`, body, "PATCH");
      setData(result);
      return result;
    } catch (e) {
      setNotice((e as Error).message);
      throw e;
    } finally {
      setSaving(false);
    }
  }
  async function select(slideId: string) {
    try {
      await mutate({ action: "select", slideId });
    } catch {}
  }
  if (!data)
    return (
      <div className="editor-loading">
        <a className="text-button" href="/">
          <Icon name="back" />
          Çalışma alanına dön
        </a>
        <ErrorNote message={error} />
        {!error && <Loading label="Eğitimin açılıyor…" />}
      </div>
    );
  const c = data.course,
    active = c.slides.find((s) => s.id === c.activeSlideId) || c.slides[0],
    index = c.slides.indexOf(active),
    draft = c.status === "draft";
  async function start() {
    setBusy(true);
    try {
      await mutate({ action: "start" });
      router.push(`/egitim/${id}/canli`);
    } catch {
    } finally {
      setBusy(false);
    }
  }
  async function finish() {
    setBusy(true);
    try {
      await mutate({ action: "end" });
      setEnd(false);
      router.push(`/?view=reports&report=${id}`);
    } catch {
    } finally {
      setBusy(false);
    }
  }
  async function move(slideId: string, target: string) {
    if (slideId === target) return;
    const ids = c.slides.map((s) => s.id);
    ids.splice(ids.indexOf(slideId), 1);
    ids.splice(ids.indexOf(target), 0, slideId);
    try {
      await mutate({ action: "reorder", ids });
    } catch {}
  }
  async function join() {
    const status = await api("status");
    setJoinBase(status.joinOrigin || window.location.origin);
    setShowJoin(true);
  }
  return (
    <div className={`editor-shell ${live ? "live-shell" : ""}`}>
      <header className="editor-header">
        <button
          className="icon-button"
          aria-label="Eğitimlerime dön"
          onClick={() => router.push("/?view=courses")}
        >
          <Icon name="back" />
        </button>
        <div className="editor-name">
          <h1>{c.name}</h1>
          <span className="small muted">
            {saving
              ? "Kaydediliyor…"
              : live
                ? "Eğitmen kontrol ekranı"
                : "Değişiklikler kaydedildi"}
            <Icon name="check" size={14} />
          </span>
        </div>
        <Status status={c.status} />
        <div className="editor-header-actions">
          {live ? (
            <>
              <button className="button" onClick={join}>
                <Icon name="users" />
                Katılım
              </button>
              <a
                className="button"
                href={`/sunum/${id}?key=${c.displayKey}`}
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="monitor" />
                Yansıt
              </a>
              {c.status === "live" && (
                <button className="button danger" onClick={() => setEnd(true)}>
                  <Icon name="stop" />
                  Eğitimi bitir
                </button>
              )}
            </>
          ) : (
            <>
              <button
                className="button"
                onClick={() => router.push(`/egitim/${id}/onizleme`)}
              >
                <Icon name="eye" />
                Önizle
              </button>
              <button
                className="button"
                onClick={() => router.push(`/egitim/${id}/prova`)}
              >
                <Icon name="mic" />
                Prova yap
              </button>
              {draft ? (
                <button
                  className="button primary"
                  disabled={busy}
                  onClick={start}
                >
                  <Icon name="play" />
                  Eğitimi başlat
                </button>
              ) : c.status === "live" ? (
                <button
                  className="button primary"
                  onClick={() => router.push(`/egitim/${id}/canli`)}
                >
                  <Icon name="play" />
                  Canlı eğitime dön
                </button>
              ) : (
                <button
                  className="button primary"
                  onClick={() => router.push(`/?view=reports&report=${id}`)}
                >
                  <Icon name="chart" />
                  Raporu aç
                </button>
              )}
            </>
          )}
        </div>
      </header>
      <aside className="slide-rail">
        <div className="rail-heading">
          {draft && !live ? (
            <button className="text-button" onClick={() => setAdd(true)}>
              <Icon name="plus" />
              Aktivite ekle
            </button>
          ) : (
            <strong>Sunum akışı</strong>
          )}
          <span>{c.slides.length} slayt</span>
        </div>
        <ol className="thumbnails">
          {c.slides.map((s, i) => (
            <li
              key={s.id}
              className={active.id === s.id ? "selected" : ""}
              onDragOver={(e) => {
                if (drag) e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                void move(drag, s.id);
                setDrag("");
              }}
            >
              <span className="slide-number">{i + 1}</span>
              <button
                className="thumbnail"
                onClick={() => select(s.id)}
                draggable={draft && !live && s.kind === "activity"}
                onDragStart={() => setDrag(s.id)}
                onDragEnd={() => setDrag("")}
                aria-label={`Slayt ${i + 1}: ${slideTitle(c, s)}`}
                aria-current={active.id === s.id ? "true" : undefined}
              >
                <SlideView course={c} slide={s} small />
              </button>
              <div className="thumbnail-caption">
                {s.kind === "document" ? (
                  <span>
                    Sunum · {c.pages.find((p) => p.id === s.pageId)?.number}
                  </span>
                ) : (
                  <>
                    <span>
                      <Icon name="activity" size={13} />
                      Aktivite
                    </span>
                    {draft && !live && (
                      <div>
                        <button
                          className="mini-button"
                          aria-label="Aktiviteyi yukarı taşı"
                          disabled={i === 0}
                          onClick={() => move(s.id, c.slides[i - 1].id)}
                        >
                          <Icon name="up" size={14} />
                        </button>
                        <button
                          className="mini-button"
                          aria-label="Aktiviteyi aşağı taşı"
                          disabled={i === c.slides.length - 1}
                          onClick={async () => {
                            const ids = c.slides.map((s) => s.id);
                            [ids[i], ids[i + 1]] = [ids[i + 1], ids[i]];
                            try {
                              await mutate({ action: "reorder", ids });
                            } catch {}
                          }}
                        >
                          <Icon name="down" size={14} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </li>
          ))}
        </ol>
        {draft && !live && (
          <button
            className="add-slide"
            onClick={() => setAdd(true)}
            aria-label="Yeni aktivite ekle"
          >
            <Icon name="plus" size={28} />
          </button>
        )}
        <div className="rail-bottom">
          <Logo />
        </div>
      </aside>
      <main className="editor-stage">
        <div className="stage-top">
          <span>
            {live ? (
              <>
                <span className="live-dot" />
                Katılımcılar bu slaytı görüyor
              </>
            ) : (
              "SUNUM ÇALIŞMA ALANI"
            )}
          </span>
          <span>
            {live ? `${data.participants.length} katılımcı` : c.originalName}
          </span>
        </div>
        <div className="presentation-canvas">
          <div className="canvas-join">
            <span>
              Katılım kodu: <strong>{c.code}</strong>
            </span>
            <Logo />
          </div>
          <SlideView course={c} slide={active} />
        </div>
        <div className="slide-controls">
          <button
            className="icon-button"
            disabled={index === 0}
            aria-label="Önceki slayt"
            onClick={() => select(c.slides[index - 1].id)}
          >
            <Icon name="left" />
          </button>
          <span>
            <strong>{index + 1}</strong> / {c.slides.length}
          </span>
          <button
            className="icon-button"
            disabled={index === c.slides.length - 1}
            aria-label="Sonraki slayt"
            onClick={() => select(c.slides[index + 1].id)}
          >
            <Icon name="right" />
          </button>
        </div>
        <ErrorNote message={notice || error} />
        {live ? (
          <div className="live-status-strip">
            <span>
              <Icon name="chat" />
              {data.questions.length} soru
            </span>
            <span>
              <Icon name="activity" />
              {
                data.responses.filter((r) => r.slideId === active.id).length
              }{" "}
              aktivite yanıtı
            </span>
            <span>
              {c.autoAnswer
                ? "AI otomatik yanıtlıyor"
                : "Sorular sana iletiliyor"}
            </span>
          </div>
        ) : (
          <div className="stage-note">
            <Icon name="file" />
            <div>
              <strong>
                {active.kind === "document"
                  ? "Orijinal sunum slaytı"
                  : "Etkileşimli aktivite"}
              </strong>
              <p>
                {active.kind === "document"
                  ? "Sunumun içeriği korunur. Bu slayttan sonra bir aktivite ekleyebilirsin."
                  : "Canlı eğitimde bu slayta geldiğinde katılımcıların Aktiviteler alanı açılır."}
              </p>
            </div>
            {draft && (
              <button className="button" onClick={() => setAdd(true)}>
                <Icon name="plus" />
                Aktivite ekle
              </button>
            )}
          </div>
        )}
      </main>
      <aside className={`editor-tools ${live ? "questions-panel" : ""}`}>
        {live ? (
          <QuestionPanel
            data={data}
            onAddress={async (questionId, value) => {
              try {
                await mutate({ action: "addressed", questionId, value });
              } catch {}
            }}
          />
        ) : (
          <>
            <div className="tool-title">
              <h2>{active.kind === "document" ? "Slayt" : "Aktivite"}</h2>
              <Icon
                name={active.kind === "document" ? "presentation" : "activity"}
              />
            </div>
            {active.kind === "document" ? (
              <>
                <p className="muted small">{slideTitle(c, active)}</p>
                <div className="tool-block">
                  <strong>Bu slaytı etkileşimli yap</strong>
                  <p>
                    Katılımcıların fikrini al veya konuyu bir senaryo üzerinden
                    tartış.
                  </p>
                  <button
                    className="button full"
                    disabled={!draft}
                    onClick={() => setAdd(true)}
                  >
                    <Icon name="plus" />
                    Aktivite ekle
                  </button>
                </div>
                <div className="tool-block">
                  <Icon name="sparkle" />
                  <strong>Dokümanla öğrenme</strong>
                  <p>
                    Asistan soruları sunumunun içeriğine dayanarak yanıtlar ve
                    kaynak slaytı gösterir.
                  </p>
                  {c.pages.every((p) => !p.text.trim()) && (
                    <ErrorNote message="Bu dosyada okunabilir metin bulunamadı. Asistan soruları eğitmene iletecek." />
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="muted small">
                  {active.activity?.type === "poll"
                    ? "Anket"
                    : active.activity?.type === "scenario"
                      ? "Senaryo"
                      : "Açık uçlu soru"}
                </p>
                <p className="activity-question-small">
                  {active.activity?.question}
                </p>
                {active.activity?.aiGenerated && (
                  <span className="ai-label">
                    <Icon name="sparkle" size={16} />
                    AI ile hazırlandı
                  </span>
                )}
                <button
                  className="button full"
                  disabled={!draft}
                  onClick={() => setEdit(true)}
                >
                  Aktiviteyi düzenle
                </button>
                {draft && (
                  <button
                    className="text-button danger-text"
                    onClick={async () => {
                      try {
                        await mutate({
                          action: "remove-activity",
                          slideId: active.id,
                        });
                      } catch {}
                    }}
                  >
                    <Icon name="trash" />
                    Aktiviteyi kaldır
                  </button>
                )}
                <div className="tool-block">
                  <strong>Akışta taşı</strong>
                  <p>
                    Sol taraftaki aktiviteyi sürükleyebilir veya oklarla
                    taşıyabilirsin.
                  </p>
                </div>
              </>
            )}
            <button className="tool-settings" onClick={() => setSettings(true)}>
              <Icon name="settings" />
              Eğitim ayarları
              <Icon name="right" size={16} />
            </button>
            <div className="tool-meta">
              <span>
                <Icon name="clock" size={16} />
                {c.accessDays} gün asistan erişimi
              </span>
              <span>
                <Icon name="chat" size={16} />
                {c.autoAnswer
                  ? "Canlı AI yanıtı açık"
                  : "Canlı AI yanıtı kapalı"}
              </span>
            </div>
          </>
        )}
      </aside>
      {add && (
        <ActivityEditor
          course={c}
          open
          onClose={() => setAdd(false)}
          onSave={async (activity) => {
            await mutate({
              action: "add-activity",
              afterId: active.id,
              activity,
            });
          }}
        />
      )}
      {edit && (
        <ActivityEditor
          key={active.id}
          course={c}
          slide={active}
          open
          onClose={() => setEdit(false)}
          onSave={async (activity) => {
            await mutate({
              action: "update-activity",
              slideId: active.id,
              activity,
            });
          }}
        />
      )}
      {settings && (
        <Settings
          course={c}
          onClose={() => setSettings(false)}
          onSave={async (body) => {
            await mutate({ action: "settings", ...body });
            setSettings(false);
          }}
        />
      )}
      <Modal
        open={end}
        onClose={() => !busy && setEnd(false)}
        title="Eğitimi bitir"
        description={`Canlı aktiviteler kapanır. Katılımcıların doküman asistanına erişimi ${c.accessDays} gün boyunca devam eder.`}
      >
        <p>
          Sorular ve aktivite sonuçları raporuna aktarılır. Bu eğitim oturumu
          yeniden başlatılamaz.
        </p>
        {busy && <Loading label="Eğitim kapatılıyor, rapor hazırlanıyor…" />}
        <ErrorNote message={notice} />
        <div className="modal-actions">
          <button
            className="button"
            onClick={() => setEnd(false)}
            disabled={busy}
          >
            Vazgeç
          </button>
          <button className="button danger" onClick={finish} disabled={busy}>
            Eğitimi bitir
          </button>
        </div>
      </Modal>
      <Modal
        open={showJoin}
        onClose={() => setShowJoin(false)}
        title="Eğitimine katılım"
        description="Katılımcılar kendi hesaplarıyla giriş yaparak bu kodla katılabilir."
      >
        <div className="join-share">
          <QRCodeSVG value={`${joinBase}/katil?kod=${c.code}`} size={170} />
          <strong>{c.code}</strong>
          <span>{joinBase}/katil</span>
          <p className="small muted">
            Telefon ve bilgisayar aynı Wi-Fi ağına bağlı olmalı.
          </p>
          <button
            className="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  `${joinBase}/katil?kod=${c.code}`,
                );
                setNotice("Katılım bağlantısı kopyalandı.");
              } catch {
                setNotice("Bağlantıyı yukarıdaki adresten kopyalayabilirsin.");
              }
            }}
          >
            <Icon name="link" />
            Bağlantıyı kopyala
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Settings({
  course: c,
  onClose,
  onSave,
}: {
  course: Course;
  onClose: () => void;
  onSave: (body: object) => Promise<void>;
}) {
  const [name, setName] = useState(c.name),
    [days, setDays] = useState(c.accessDays),
    [auto, setAuto] = useState(c.autoAnswer),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Modal open onClose={onClose} title="Eğitim ayarları">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await onSave({ name, accessDays: days, autoAnswer: auto });
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Eğitim adı
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={120}
          />
        </label>
        <label>
          Eğitim sonrası asistan erişimi
          <div className="input-unit">
            <input
              type="number"
              min={0}
              max={365}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
            <span>gün</span>
          </div>
          <small>Eğitimin bitişinden itibaren hesaplanır.</small>
        </label>
        <label className="toggle-field">
          <span>
            <strong>Canlı eğitimde otomatik AI yanıtı</strong>
            <small>Kapalıyken sorular doğrudan sana iletilir.</small>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={auto}
            onChange={(e) => setAuto(e.target.checked)}
          />
        </label>
        <ErrorNote message={error} />
        <div className="modal-actions">
          <button className="button primary" disabled={busy}>
            Kaydet
          </button>
        </div>
      </form>
    </Modal>
  );
}
function QuestionPanel({
  data,
  onAddress,
}: {
  data: CourseState;
  onAddress: (id: string, value: boolean) => Promise<void>;
}) {
  const [filter, setFilter] = useState("all");
  const questions = data.questions.filter(
      (q) =>
        filter === "all" ||
        ((q.status === "escalated" || q.status === "manual") && !q.addressed),
    ),
    groups = [
      ...new Map(questions.map((q) => [q.groupId, q.groupTitle])).entries(),
    ];
  return (
    <>
      <div className="tool-title">
        <h2>Katılımcı soruları</h2>
        <span className="count">{data.questions.length}</span>
      </div>
      <div className="segmented compact">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          Tümü
        </button>
        <button
          className={filter === "teacher" ? "active" : ""}
          onClick={() => setFilter("teacher")}
        >
          Sana iletilenler
        </button>
      </div>
      <p className="small muted">
        Benzer sorular gruplanır. Yanıtlar yalnızca soruyu soran katılımcıya
        görünür.
      </p>
      {groups.length ? (
        groups.map(([id, title]) => (
          <details
            className="question-group"
            key={id}
            open={filter === "teacher"}
          >
            <summary>
              {title}
              <span>{questions.filter((q) => q.groupId === id).length}</span>
            </summary>
            {questions
              .filter((q) => q.groupId === id)
              .map((q) => (
                <div className="question-record" key={q.id}>
                  <span className="small muted">{q.userName}</span>
                  <strong>{q.text}</strong>
                  {q.answer ? (
                    <>
                      <p>{q.answer}</p>
                      <span className="source">
                        AI · Slayt {q.sources.join(", ")}
                      </span>
                    </>
                  ) : (
                    <>
                      <p
                        className={
                          q.status === "pending" ? "muted" : "forwarded"
                        }
                      >
                        {q.status === "pending"
                          ? "AI yanıtı hazırlanıyor…"
                          : q.status === "manual"
                            ? "Doğrudan sana iletildi."
                            : q.reason}
                      </p>
                      {q.status !== "pending" && (
                        <button
                          className={`text-button ${q.addressed ? "success-text" : ""}`}
                          onClick={() => onAddress(q.id, !q.addressed)}
                        >
                          <Icon name="check" size={16} />
                          {q.addressed ? "Ele alındı" : "Ele aldım"}
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}
          </details>
        ))
      ) : (
        <Empty
          icon="chat"
          title={
            filter === "all" ? "Sorular burada toplanacak" : "Bekleyen soru yok"
          }
          description={
            filter === "all"
              ? "Katılımcılar sohbetten sorduğunda yanıtları bu alandan takip edebilirsin."
              : "Yanıtlanamayan veya doğrudan sana yönlendirilen sorular burada görünür."
          }
        />
      )}
    </>
  );
}

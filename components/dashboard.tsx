"use client";
import { ThemeMenu } from "./theme-menu";
import { ReportAssistantLink } from "./report-assistant";
import {
  CardListSkeleton,
  DashboardSkeleton,
  ParticipantListSkeleton,
  ReportDetailSkeleton,
  ReportTableSkeleton,
} from "./skeletons";
import { useLocale } from "./locale-provider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { pollResults } from "@/lib/activities";
import type { Course, CourseState, User } from "@/lib/types";
import { Auth } from "./auth";
import { HeaderActions } from "./header-actions";
import {
  Icon,
  Logo,
  Modal,
  ErrorNote,
  Loading,
  ResourceFailure,
  Empty,
  Status,
  api,
  useResource,
  date,
} from "./ui";

export function CreateTraining({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (course: Course) => void;
}) {
  const { t } = useLocale();

  const [file, setFile] = useState<File>(),
    [name, setName] = useState(""),
    [days, setDays] = useState(7),
    [auto, setAuto] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function create(demo = false) {
    setError("");
    setBusy(true);
    try {
      let body: FormData | object;
      if (demo) body = { demo: true, accessDays: days, autoAnswer: auto };
      else {
        if (!file) throw new Error(t("Sunum dosyanı seç."));
        const form = new FormData();
        form.set("file", file);
        form.set("name", name);
        form.set("accessDays", String(days));
        form.set("autoAnswer", String(auto));
        body = form;
      }
      const result = await api("courses", body);
      onCreated(result.course);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      open={open}
      onClose={() => !busy && onClose()}
      title={t("Yeni eğitim oluştur")}
      description={t("Sunumunu yükle ve katılımcı erişimini belirle.")}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void create();
        }}
      >
        <label className={`upload-zone ${file ? "has-file" : ""}`}>
          <Icon name={file ? "file" : "upload"} size={32} />
          <strong>
            {file ? file.name : t("Sunumunu buraya bırak veya dosya seç")}
          </strong>
          <span>{t("PDF veya PPTX · En fazla 30 MB · 80 slayt")}</span>
          <input
            type="file"
            accept=".pdf,.pptx"
            aria-label={t("Sunum dosyası")}
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              setFile(f);
              if (f) setName(f.name.replace(/\.[^.]+$/, ""));
            }}
          />
        </label>
        <label>
          {t("Eğitim adı")}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("Dosya adı otomatik kullanılır")}
            maxLength={120}
          />
        </label>
        <label>
          {t("Eğitim sonrası asistan erişimi")}
          <div className="input-unit">
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              min={0}
              max={365}
              required
            />
            <span>{t("gün")}</span>
          </div>
          <small>
            {t(
              "Süre eğitim bittiğinde başlar. 0 gün seçersen eğitimle birlikte kapanır.",
            )}
          </small>
        </label>
        <label className="toggle-field">
          <span>
            <strong>{t("Canlı eğitimde otomatik AI yanıtı")}</strong>
            <small>
              {t(
                "Katılımcının sorusu dokümanından yanıtlanır. Yanıtlanamayanlar sana iletilir.",
              )}
            </small>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={auto}
            onChange={(e) => setAuto(e.target.checked)}
          />
        </label>
        <ErrorNote message={error} />
        {busy && (
          <Loading label={t("Sunum işleniyor, slaytlar hazırlanıyor…")} />
        )}
        <div className="modal-actions">
          <button
            type="button"
            className="text-button"
            disabled={busy}
            onClick={() => create(true)}
          >
            {t("Örnek sunum kullan")}
          </button>
          <button className="button primary" disabled={busy}>
            <Icon name="plus" />
            {t("Eğitimi oluştur")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function Report({ id, onBack }: { id: string; onBack: () => void }) {
  const { t, locale } = useLocale();

  const { data, error, refresh } = useResource<CourseState>(
    `courses/${id}`,
    5000,
  );
  const loaded = !!data;
  useEffect(() => {
    const section = location.hash.slice(1);
    if (
      loaded &&
      ["report-overview", "report-questions", "report-activities"].includes(
        section,
      )
    )
      document.getElementById(section)?.scrollIntoView({ block: "start" });
  }, [loaded, id]);
  if (!data)
    return error ? (
      <ResourceFailure error={error} onRetry={refresh} />
    ) : (
      <ReportDetailSkeleton />
    );
  const { course: c, questions, participants, responses } = data;
  const groups = [
    ...new Map(questions.map((q) => [q.groupId, q.groupTitle])).entries(),
  ];
  return (
    <div className="report-detail">
      <button className="text-button" onClick={onBack}>
        <Icon name="back" />
        {t("Raporlara dön")}
      </button>
      <div className="page-title">
        <div>
          <span className="eyebrow">{t("EĞİTİM RAPORU")}</span>
          <h1>{c.name}</h1>
          <p className="muted">
            {c.endedAt ? date(c.endedAt, locale) : t("Henüz tamamlanmadı")}{" "}
            {t("· Eğitim sonrası kayıtlarla güncellenir.")}
          </p>
        </div>
        <div className="report-title-actions">
          <Status status={c.status} />
          <ReportAssistantLink id={c.id} />
        </div>
      </div>
      <div className="metrics" id="report-overview">
        {[
          [participants.length, t("Katılımcı")],
          [questions.length, t("Soru")],
          [
            questions.filter((q) => q.status === "answered").length,
            t("AI yanıtı"),
          ],
          [responses.length, t("Aktivite yanıtı")],
        ].map(([number, label]) => (
          <div key={label}>
            <strong>{number}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <section className="report-section">
        <div className="section-title">
          <h2>{t("Eğitim özeti")}</h2>
          <span className="small muted">
            {c.report?.ai
              ? t("AI tarafından hazırlandı")
              : t("Kayıtlardan derlendi")}
            {c.report && ` · ${date(c.report.updatedAt, locale)}`}
          </span>
        </div>
        <p>
          {c.report?.summary ||
            t("Eğitim tamamlandığında özet burada hazırlanır.")}
        </p>
        {c.report?.recommendations.length ? (
          <ul className="recommendations">
            {c.report.recommendations.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        ) : null}
      </section>
      <section className="report-section" id="report-questions">
        <h2>
          {t("Sorular ve yanıtlar")}{" "}
          <span className="count">{questions.length}</span>
        </h2>
        {groups.length ? (
          groups.map(([id, title]) => (
            <details key={id} className="question-group">
              <summary>
                {title}
                <span>
                  {questions.filter((q) => q.groupId === id).length} {t("soru")}
                </span>
              </summary>
              {questions
                .filter((q) => q.groupId === id)
                .map((q) => (
                  <div className="question-record" key={q.id}>
                    <div className="small muted">
                      {q.userName} ·{" "}
                      {q.stage === "followup"
                        ? t("Eğitim sonrası")
                        : t("Canlı eğitim")}{" "}
                      · {date(q.createdAt, locale)}
                    </div>
                    <strong>{q.text}</strong>
                    <p>
                      {q.answer ||
                        (q.status === "manual"
                          ? t("Eğitmene iletildi.")
                          : q.reason || t("Sorun eğitmene iletildi."))}
                    </p>
                    {q.sources.length > 0 && (
                      <span className="source">
                        {t("Kaynak: Slayt")} {q.sources.join(", ")}
                      </span>
                    )}
                  </div>
                ))}
            </details>
          ))
        ) : (
          <p className="muted">{t("Henüz soru yok.")}</p>
        )}
      </section>
      <section className="report-section" id="report-activities">
        <h2>
          {t("Aktivite sonuçları")}{" "}
          <span className="count">{responses.length}</span>
        </h2>
        {c.slides
          .filter((s) => s.kind === "activity")
          .map((s) => {
            const rs = responses.filter((r) => r.slideId === s.id);
            return (
              <div className="activity-result" key={s.id}>
                <h3>{s.activity?.question}</h3>
                <p className="small muted">
                  {rs.length} {t("yanıt")}
                </p>
                {s.activity?.type === "poll"
                  ? pollResults(s.activity.options, rs).map(
                      ({ option, count, percentage }) => {
                        return (
                          <div className="result-row" key={option}>
                            <span>{option}</span>
                            <div className="result-track">
                              <i
                                style={{
                                  width: `${percentage}%`,
                                }}
                              />
                            </div>
                            <strong>{count}</strong>
                          </div>
                        );
                      },
                    )
                  : rs.map((r) => (
                      <div className="question-record" key={r.id}>
                        <span className="small muted">{r.userName}</span>
                        <p>{r.value}</p>
                      </div>
                    ))}
              </div>
            );
          })}
        {!c.slides.some((s) => s.kind === "activity") && (
          <p className="muted">{t("Bu eğitimde aktivite bulunmuyor.")}</p>
        )}
      </section>
    </div>
  );
}

export function Dashboard() {
  const { t, locale } = useLocale();

  const router = useRouter();
  const auth = useResource<{ user?: User; aiReady: boolean; model: string }>(
    "auth",
  );
  const courses = useResource<{ courses: Course[] }>(
    `courses?account=${auth.data?.user?.id || ""}`,
    0,
    !!auth.data?.user,
  );
  const [view, setView] = useState("home"),
    [search, setSearch] = useState(""),
    [create, setCreate] = useState(false),
    [report, setReport] = useState(""),
    [mobile, setMobile] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("view")) setView(params.get("view")!);
    if (params.get("report")) {
      setView("reports");
      setReport(params.get("report")!);
    }
  }, []);
  if (!auth.data)
    return auth.error ? (
      <ResourceFailure error={auth.error} onRetry={auth.refresh} />
    ) : (
      <DashboardSkeleton view={view} />
    );
  if (!auth.data.user)
    return (
      <Auth
        onDone={() => {
          void auth.refresh();
        }}
      />
    );
  const user = auth.data.user;
  if (user.role === "participant")
    return (
      <div className="participant-home">
        <header>
          <Logo />
          <ThemeMenu />
          <button
            className="text-button"
            onClick={async () => {
              await api("auth", undefined, "DELETE");
              await auth.refresh();
            }}
          >
            <Icon name="logout" />
            {t("Çıkış")}
          </button>
        </header>
        <div>
          <h1>
            {t("Merhaba,")} {user.name.split(" ")[0]}.
          </h1>
          <p className="muted">
            {t("Eğitmeninin paylaştığı kodla eğitime katıl.")}
          </p>
          <JoinForm />
          {!courses.data ? (
            courses.error ? (
              <ResourceFailure
                error={courses.error}
                onRetry={courses.refresh}
              />
            ) : (
              <ParticipantListSkeleton />
            )
          ) : (
            courses.data.courses.map((c) => (
              <button
                className="joined-course"
                key={c.id}
                onClick={() => router.push(`/katil?egitim=${c.id}`)}
              >
                <Icon name="presentation" />
                <span>
                  {c.name}
                  <small>{date(c.createdAt, locale)}</small>
                </span>
                <Status status={c.status} />
                <Icon name="arrow" />
              </button>
            ))
          )}
        </div>
      </div>
    );
  const list = (courses.data?.courses || []).filter((c) =>
      c.name
        .toLocaleLowerCase("tr-TR")
        .includes(search.toLocaleLowerCase("tr-TR")),
    ),
    reports = list.filter((c) => c.status === "ended");
  function change(next: string) {
    setView(next);
    setReport("");
    setMobile(false);
    router.replace(`/?view=${next}`);
  }
  function openReport(id: string) {
    setView("reports");
    setReport(id);
    router.replace(`/?view=reports&report=${id}`);
  }
  return (
    <div className="app-shell">
      <header className="app-header">
        <button
          className="icon-button mobile-menu"
          aria-label={t("Menüyü aç")}
          onClick={() => setMobile(!mobile)}
        >
          <Icon name="menu" />
        </button>
        <Logo />
        <label className="header-search">
          <Icon name="search" />
          <input
            aria-label={t("Eğitimlerde ara")}
            placeholder={t("Eğitimlerinde ara…")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="icon-button"
              aria-label={t("Aramayı temizle")}
              onClick={() => setSearch("")}
            >
              <Icon name="close" size={16} />
            </button>
          )}
        </label>
        <HeaderActions
          user={user}
          courses={courses.data?.courses || []}
          onSettings={() => change("settings")}
          onReport={openReport}
          onLogout={async () => {
            await api("auth", undefined, "DELETE");
            await auth.refresh();
          }}
        />
      </header>
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <nav>
          {[
            ["home", "home", t("Ana sayfa")],
            ["courses", "folder", t("Eğitimlerim")],
            ["reports", "chart", t("Raporlar")],
          ].map(([v, icon, label]) => (
            <button
              key={v}
              className={view === v ? "active" : ""}
              onClick={() => change(v)}
            >
              <Icon name={icon as "home"} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Icon name="presentation" />
            <strong>
              {t("Bir sunum.")}
              <br />
              {t("Birlikte öğrenmenin yeni yolu.")}
            </strong>
            <p>{t("Eğitimden önce, eğitim sırasında ve sonrasında.")}</p>
          </div>
          <button
            className={view === "settings" ? "active" : ""}
            onClick={() => change("settings")}
          >
            <Icon name="settings" />
            {t("Ayarlar")}
          </button>
          <button
            onClick={async () => {
              await api("auth", undefined, "DELETE");
              await auth.refresh();
            }}
          >
            <Icon name="logout" />
            {t("Çıkış yap")}
          </button>
        </div>
      </aside>
      <main className="dashboard-main">
        {view === "settings" ? (
          <>
            <div className="page-title">
              <div>
                <h1>{t("Ayarlar")}</h1>
                <p className="muted">{t("Hesabın ve model bağlantısı.")}</p>
              </div>
            </div>
            <section className="settings-section">
              <h2>{t("Hesap")}</h2>
              <dl>
                <dt>{t("Ad soyad")}</dt>
                <dd>{user.name}</dd>
                <dt>{t("Hesap tipi")}</dt>
                <dd>{t("Eğitmen")}</dd>
                <dt>{t("E-posta")}</dt>
                <dd>{user.email || t("Deneme hesabı")}</dd>
              </dl>
              <h2>{t("Yapay zekâ bağlantısı")}</h2>
              <p className={auth.data.aiReady ? "success-text" : "muted"}>
                <Icon name={auth.data.aiReady ? "success" : "warning"} />
                {auth.data.aiReady
                  ? t("Model bağlantısı ayarlandı")
                  : t("API anahtarı henüz eklenmedi")}
              </p>
              <p className="muted">
                {t(
                  "Doküman sohbeti, aktiviteler ve sesli prova aynı modeli kullanır.",
                )}
              </p>
              <code>{auth.data.model}</code>
            </section>
          </>
        ) : view === "reports" ? (
          report ? (
            <Report id={report} onBack={() => change("reports")} />
          ) : (
            <>
              <div className="page-title">
                <div>
                  <h1>{t("Raporlar")}</h1>
                  <p className="muted">
                    {t(
                      "Tamamlanan eğitimlerinin soruları ve aktivite sonuçları.",
                    )}
                  </p>
                </div>
                <ReportAssistantLink />
              </div>
              {!courses.data ? (
                courses.error ? (
                  <ResourceFailure
                    error={courses.error}
                    onRetry={courses.refresh}
                  />
                ) : (
                  <ReportTableSkeleton />
                )
              ) : reports.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>{t("Eğitim")}</th>
                        <th>{t("Tamamlanma")}</th>
                        <th>{t("Asistan erişimi")}</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((c) => (
                        <tr key={c.id} onClick={() => openReport(c.id)}>
                          <td>
                            <button
                              className="table-link"
                              onClick={() => openReport(c.id)}
                            >
                              {c.name}
                            </button>
                          </td>
                          <td>{c.endedAt && date(c.endedAt, locale)}</td>
                          <td>
                            {c.accessDays} {t("gün")}
                          </td>
                          <td>
                            <Icon name="arrow" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty
                  icon="chart"
                  title={t("İlk raporun eğitimin bitince burada")}
                  description={t(
                    "Sorular, AI yanıtları ve aktiviteler otomatik olarak bir araya gelir.",
                  )}
                />
              )}
            </>
          )
        ) : (
          <>
            <div className="page-title">
              <div>
                <h1>
                  {view === "home" ? (
                    <>
                      {t("Merhaba,")} <span>{user.name.split(" ")[0]}.</span>
                    </>
                  ) : (
                    t("Eğitimlerim")
                  )}
                </h1>
                <p className="muted">
                  {view === "home"
                    ? t("Bir sonraki eğitimine buradan başla.")
                    : t("Sunumlarını hazırla, prova yap ve eğitimini başlat.")}
                </p>
              </div>
            </div>
            <div className="page-actions">
              <button
                className="button primary"
                onClick={() => setCreate(true)}
              >
                <Icon name="plus" />
                {t("Yeni eğitim")}
              </button>
              <span className="small muted">
                {t("PDF veya PPTX sunumundan oluştur.")}
              </span>
            </div>
            {courses.data && courses.error && (
              <ErrorNote message={courses.error} />
            )}
            <section className="training-section">
              <div className="section-title">
                <h2>
                  {search
                    ? t("Arama sonuçları")
                    : view === "home"
                      ? t("Son eğitimlerin")
                      : t("Tüm eğitimler")}
                </h2>
                {view === "home" && (
                  <button
                    className="text-button"
                    onClick={() => change("courses")}
                  >
                    {t("Tümünü gör")}
                    <Icon name="right" />
                  </button>
                )}
              </div>
              {!courses.data ? (
                courses.error ? (
                  <ResourceFailure
                    error={courses.error}
                    onRetry={courses.refresh}
                  />
                ) : (
                  <CardListSkeleton />
                )
              ) : list.length ? (
                <div className="training-grid">
                  {list.slice(0, view === "home" ? 6 : undefined).map((c) => (
                    <button
                      className="training-card"
                      key={c.id}
                      onClick={() => router.push(`/egitim/${c.id}`)}
                    >
                      <div className="training-cover">
                        <div className="cover-decoration">
                          <i />
                          <i />
                          <i />
                        </div>
                        <Logo />
                        <strong>{c.name}</strong>
                        <Icon name="presentation" size={25} />
                      </div>
                      <div className="training-card-content">
                        <Status status={c.status} />
                        <h3>{c.name}</h3>
                        <div className="card-meta">
                          <span>{date(c.createdAt, locale)}</span>
                          <Icon name="arrow" size={18} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <Empty
                  title={
                    search
                      ? t("Eşleşen eğitim bulunamadı")
                      : t("İlk eğitimini oluşturalım")
                  }
                  description={
                    search
                      ? t("Başka bir adla aramayı deneyebilirsin.")
                      : t(
                          "Sunumunu yükle. Aktiviteler ve sesli prova eğitim çalışma alanında seni bekliyor.",
                        )
                  }
                >
                  {!search && (
                    <button className="button" onClick={() => setCreate(true)}>
                      <Icon name="plus" />
                      {t("Eğitim oluştur")}
                    </button>
                  )}
                </Empty>
              )}
            </section>
            {view === "home" && (
              <section className="home-guide">
                <div>
                  <span className="guide-number">01</span>
                  <h3>{t("Sunumunu yükle")}</h3>
                  <p>{t("Dokümanın, eğitiminin kaynağı olsun.")}</p>
                </div>
                <div>
                  <span className="guide-number">02</span>
                  <h3>{t("Akışını hazırla")}</h3>
                  <p>{t("Aktivitelerini yerleştir, kitlenle prova yap.")}</p>
                </div>
                <div>
                  <span className="guide-number">03</span>
                  <h3>{t("Birlikte öğren")}</h3>
                  <p>{t("Eğitimi başlat, soruları ve yanıtları takip et.")}</p>
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <CreateTraining
        open={create}
        onClose={() => setCreate(false)}
        onCreated={(c) => router.push(`/egitim/${c.id}`)}
      />
    </div>
  );
}
export function JoinForm({
  onJoin,
  initialCode = "",
}: {
  onJoin?: (id: string) => void;
  initialCode?: string;
}) {
  const { t } = useLocale();

  const router = useRouter(),
    [code, setCode] = useState(initialCode),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="join-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          const result = await api("join", { code });
          onJoin
            ? onJoin(result.id)
            : router.push(`/katil?egitim=${result.id}`);
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        {t("Eğitim kodu")}
        <input
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          inputMode="numeric"
          placeholder={t("6 haneli kod")}
          minLength={6}
          maxLength={6}
          required
        />
      </label>
      <button className="button primary" disabled={busy}>
        {t("Eğitime katıl")}
        <Icon name="arrow" />
      </button>
      <ErrorNote message={error} />
    </form>
  );
}

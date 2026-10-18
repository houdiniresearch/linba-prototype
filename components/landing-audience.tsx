"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale } from "./locale-provider";
import { Icon } from "./ui";
import "./landing-audience.css";

const audiences = [
  {
    id: "corporate",
    label: "Corporate trainer",
    title: "A confident start for a new team.",
    text: "Describe your audience before delivering product training to new starters. Practice out loud with AI agents representing your participants, and get feedback on your delivery, pace and responses to questions.",
    benefit: "Go into your training prepared.",
    filename: "Product training.pdf",
    scenes: ["Your audience", "Voice practice", "Feedback"],
    summary:
      "Example practice: an instructor describes their audience and practices out loud with AI agents representing the participants. Afterwards, they receive performance feedback on clarity, pace and how they handled questions.",
  },
  {
    id: "academic",
    label: "University instructor",
    title: "Collect responses. Understand the thinking behind them.",
    text: "Invite written responses to an open question. An AI agent summarises shared ideas and misconceptions so you can see what needs another explanation.",
    benefit:
      "Understand how your class is thinking, beyond individual answers.",
    filename: "Research methods.pdf",
    scenes: ["Responses", "AI analysis", "Confusion spike"],
    summary:
      "Example AI activity: students write responses about correlation and causation, and AI summarises a shared misconception. The proposed confusion spike feature highlights similar questions concentrated on one slide for the instructor.",
  },
  {
    id: "independent",
    label: "Independent educator",
    title: "The workshop ends. Learning keeps going.",
    text: "Give participants a learning agent after your workshop. Let them ask questions and revisit training materials for the period you choose.",
    benefit: "Keep knowledge available when they need it.",
    filename: "Cell biology.pdf",
    scenes: ["Ask a question", "Explore the answer", "View the source"],
    summary:
      "Example post-training conversation: a participant asks how to tell apart the plant and animal cells shown by the instructor. The assistant explains the differences in the presentation and points to the relevant slide. The participant can keep asking questions during the 7-day assistant access period set by the instructor.",
  },
  {
    id: "institution",
    label: "Educational institutions",
    title: "Understand student behaviour. Improve your training.",
    text: "Which topics do our students struggle with most? What can we improve in future training? Explore participation, activity responses and student behaviour with your report agent.",
    benefit: "Build a roadmap for your next training from each session.",
    filename: "Research methods · Training report",
    scenes: ["Training report", "Learning needs", "Next training"],
    summary:
      "Example institutional report: participation, activity responses and student behaviour from the Research methods training on 15 October 2026. The institution asks its report agent which topics students struggle with most and what to improve in future training.",
  },
] as const;

function AudienceDemo({
  kind,
  scene,
}: {
  kind: (typeof audiences)[number]["id"];
  scene: number;
}) {
  const { t } = useLocale();
  if (kind === "institution")
    return (
      <div className="audience-demo-stage" data-scene={scene}>
        <div
          className="audience-demo-scene audience-report-cover"
          data-active={scene === 0}
        >
          <div className="audience-report-heading">
            <div className="audience-report-topline">
              <span>{t("Training report")}</span>
              <span className="audience-report-status">
                <i />
                {t("Completed")}
              </span>
            </div>
            <h4>{t("Research methods")}</h4>
            <p>{t("15 October 2026 · Completed training")}</p>
          </div>
          <div className="audience-report-visuals">
            <div className="audience-report-participation">
              <h5>{t("Student participation")}</h5>
              <svg
                viewBox="0 0 320 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  className="audience-report-grid"
                  d="M0 18H320M0 52H320M0 86H320M96 0V100M224 0V100"
                />
                <path
                  className="audience-report-area"
                  d="M0 77C16 77 22 63 40 66S62 42 80 45S102 24 120 30S142 52 160 43S182 57 200 46S220 22 240 26S262 11 280 19S304 16 320 14V100H0Z"
                />
                <path
                  className="audience-report-line"
                  d="M0 77C16 77 22 63 40 66S62 42 80 45S102 24 120 30S142 52 160 43S182 57 200 46S220 22 240 26S262 11 280 19S304 16 320 14"
                />
                <circle
                  cx="200"
                  cy="46"
                  r="5"
                  fill="var(--bg)"
                  stroke="var(--lilac-ink)"
                  strokeWidth="2"
                />
              </svg>
              <div className="audience-report-axis">
                <span>{t("Start")}</span>
                <span>{t("Activity")}</span>
                <span>{t("End")}</span>
              </div>
            </div>
            <div className="audience-report-responses">
              <h5>{t("Activity responses")}</h5>
              <div className="audience-report-response-bars">
                {[
                  { label: "Clear explanation", width: "48%", tone: "clear" },
                  {
                    label: "Partial explanation",
                    width: "34%",
                    tone: "partial",
                  },
                  { label: "Needs review", width: "18%", tone: "review" },
                ].map((item) => (
                  <div key={item.tone} data-tone={item.tone}>
                    <span>{t(item.label)}</span>
                    <div>
                      <i style={{ width: item.width }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="audience-report-focus">
            <span className="audience-report-focus-marker" />
            <div>
              <span>{t("Revisit this topic")}</span>
              <strong>{t("Correlation and causation")}</strong>
              <p>
                {t(
                  "Similar questions and incomplete answers cluster around this topic.",
                )}
              </p>
            </div>
          </div>
        </div>
        <div
          className="audience-demo-scene audience-report-conversation"
          data-active={scene === 1}
        >
          <div className="audience-chat-question">
            {t("Which topics do our students struggle with most?")}
          </div>
          <div className="audience-chat-answer">
            <span className="audience-message-label">
              <Icon name="sparkle" size={16} />
              {t("Report agent")}
            </span>
            <p>
              {t(
                "Activity responses suggest difficulty distinguishing correlation from causation.",
              )}
            </p>
            <div className="audience-source">
              <Icon name="chart" size={17} />
              {t("Based on activity responses and the training report")}
            </div>
          </div>
        </div>
        <div
          className="audience-demo-scene audience-report-conversation"
          data-active={scene === 2}
        >
          <div className="audience-chat-question">
            {t("What can we improve in future training?")}
          </div>
          <div className="audience-chat-answer">
            <span className="audience-message-label">
              <Icon name="sparkle" size={16} />
              {t("Report agent")}
            </span>
            <p>
              {t(
                "Add counterexamples to the correlation and causation section. Use short activities to see how students apply the concept.",
              )}
            </p>
            <div className="audience-report-next">
              <Icon name="presentation" size={19} />
              <span>{t("Counterexamples → Practice → Feedback")}</span>
            </div>
          </div>
        </div>
      </div>
    );
  if (kind === "corporate")
    return (
      <div className="audience-demo-stage" data-scene={scene}>
        <div className="audience-demo-scene" data-active={scene === 0}>
          <span className="audience-message-label">
            <Icon name="users" size={16} />
            {t("Your audience brief")}
          </span>
          <blockquote className="audience-audience-brief">
            {t(
              "A new sales team presenting the product for the first time, with limited customer experience.",
            )}
          </blockquote>
          <span className="audience-message-label">
            <Icon name="sparkle" size={16} />
            {t("AI participant agents")}
          </span>
          <div className="audience-persona-list">
            <div>
              <span>EA</span>
              <p>
                <strong>Ece</strong>
                <small>{t("New starter")}</small>
              </p>
            </div>
            <div>
              <span>MK</span>
              <p>
                <strong>Mert</strong>
                <small>{t("Customer representative")}</small>
              </p>
            </div>
            <div>
              <span>SY</span>
              <p>
                <strong>Selin</strong>
                <small>{t("Curious participant")}</small>
              </p>
            </div>
          </div>
        </div>
        <div
          className="audience-demo-scene audience-rehearsal-scene"
          data-active={scene === 1}
        >
          <div className="audience-mini-slide">
            <span>{t("Start by understanding your customer.")}</span>
            <p>{t("Understand the need. Ask the right question.")}</p>
            <div className="audience-slide-rule" />
            <span className="audience-slide-caption">01 / 08</span>
          </div>
          <div className="audience-voice-row">
            <div className="audience-personas">
              <span>EA</span>
              <span>MK</span>
              <span>SY</span>
            </div>
            <div className="audience-wave">
              {[8, 17, 12, 25, 18, 30, 14, 23, 10, 18, 26, 12].map(
                (height, index) => (
                  <i
                    key={index}
                    style={{ height, animationDelay: `${index * -0.11}s` }}
                  />
                ),
              )}
            </div>
            <Icon name="mic" size={18} />
          </div>
          <div className="audience-demo-message audience-agent-question">
            <span className="audience-message-label">
              {t("Ece · AI agent")}
            </span>
            <p>
              {t(
                "How should I respond if the customer asks about price straight away?",
              )}
            </p>
          </div>
        </div>
        <div className="audience-demo-scene" data-active={scene === 2}>
          <span className="audience-message-label">
            <Icon name="sparkle" size={16} />
            {t("Your practice performance")}
          </span>
          <h4 className="audience-scene-title">
            {t("See your delivery from another perspective.")}
          </h4>
          <div className="audience-performance-point">
            <Icon name="check" size={18} />
            <p>
              {t(
                "You explained the main idea clearly and answered the question directly.",
              )}
            </p>
          </div>
          <div className="audience-performance-point">
            <Icon name="mic" size={18} />
            <p>
              {t(
                "You sped up during the example. Leave a short pause after the key point.",
              )}
            </p>
          </div>
        </div>
      </div>
    );
  if (kind === "academic")
    return (
      <div className="audience-demo-stage" data-scene={scene}>
        <div
          className="audience-demo-scene"
          data-active={scene === 0}
          key="responses"
        >
          <div className="audience-activity-question">
            <span className="audience-message-label">
              <Icon name="activity" size={16} />
              {t("AI activity")}
            </span>
            <strong>{t("Does correlation imply causation?")}</strong>
          </div>
          <div className="audience-written-responses">
            <span className="audience-message-label">
              {t("Example written responses")}
            </span>
            <div>
              <span className="audience-response-avatar">EA</span>
              <p>
                {t("If two values increase together, one causes the other.")}
              </p>
            </div>
            <div>
              <span className="audience-response-avatar">MK</span>
              <p>{t("A third factor could be affecting both of them.")}</p>
            </div>
          </div>
        </div>
        <div
          className="audience-demo-scene"
          data-active={scene === 1}
          key="analysis"
        >
          <div className="audience-analysis-map">
            <div className="audience-analysis-inputs">
              <Icon name="chat" size={23} />
              <Icon name="chat" size={23} />
              <Icon name="chat" size={23} />
            </div>
            <span className="audience-analysis-connector" />
            <span className="audience-analysis-core">
              <Icon name="sparkle" size={32} />
            </span>
            <span className="audience-analysis-connector" />
            <div className="audience-analysis-groups">
              <span>{t("Shared ideas")}</span>
              <span>{t("Misconceptions")}</span>
            </div>
          </div>
          <div className="audience-response-analysis">
            <span className="audience-message-label">
              <Icon name="sparkle" size={16} />
              {t("AI analysis")}
            </span>
            <p>
              {t(
                "Some responses interpret correlation as a direct cause-and-effect relationship.",
              )}
            </p>
          </div>
        </div>
        <div
          className="audience-demo-scene audience-confusion-signal"
          data-active={scene === 2}
          key="confusion"
        >
          <div className="audience-confusion-heading">
            <strong>Confusion spike</strong>
          </div>
          <p className="audience-confusion-subtitle">{t("Confusion signal")}</p>
          <div className="audience-confusion-detail">
            <svg viewBox="0 0 400 106" aria-hidden="true">
              <path
                d="M8 25H392M8 57H392M8 90H392"
                fill="none"
                stroke="currentColor"
                opacity=".12"
              />
              <path
                d="M8 86L43 83L78 87L113 77L148 80L183 72L218 78L253 65L288 16L323 55L358 68L392 76V98H8Z"
                fill="currentColor"
                opacity=".08"
              />
              <path
                d="M8 86L43 83L78 87L113 77L148 80L183 72L218 78L253 65L288 16L323 55L358 68L392 76"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M288 16V98"
                stroke="currentColor"
                strokeDasharray="3 5"
                opacity=".35"
              />
              <circle
                cx="288"
                cy="16"
                r="11"
                fill="currentColor"
                opacity=".12"
              />
              <circle cx="288" cy="16" r="4" fill="currentColor" />
            </svg>
            <p>
              {t(
                "Slide 08 · Similar questions are clustering around this concept.",
              )}
            </p>
          </div>
          <span className="audience-confusion-suggestion">
            <Icon name="chat" size={17} />
            {t("Consider revisiting it with a counterexample.")}
          </span>
        </div>
      </div>
    );
  return (
    <div className="audience-demo-stage" data-scene={scene}>
      <div className="audience-demo-scene" data-active={scene === 0}>
        <span className="audience-message-label">
          <Icon name="clock" size={16} />
          {t("After training")}
        </span>
        <h4 className="audience-scene-title">
          {t("Keep asking after training.")}
        </h4>
        <p className="audience-scene-description">
          {t("Revisit a topic from the workshop.")}
        </p>
        <div className="audience-followup-question">
          <span className="audience-response-avatar">MK</span>
          <div className="audience-chat-question">
            {t(
              "How do we tell apart the plant and animal cells the instructor showed us?",
            )}
          </div>
        </div>
      </div>
      <div className="audience-demo-scene" data-active={scene === 1}>
        <div className="audience-chat-answer">
          <span className="audience-message-label">
            <Icon name="sparkle" size={16} />
            {t("Post-training assistant")}
          </span>
          <p>
            {t(
              "Plant cells have a cell wall and a large central vacuole; photosynthetic cells also have chloroplasts. Animal cells have no cell wall or chloroplasts. Both have a cell membrane.",
            )}
          </p>
          <div className="audience-source">
            <Icon name="file" size={17} />
            {t("Slide 06 · Plant and animal cells")}
            <Icon name="arrow" size={14} />
          </div>
        </div>
      </div>
      <div className="audience-demo-scene" data-active={scene === 2}>
        <span className="audience-message-label">
          <Icon name="file" size={16} />
          {t("Return to the source.")}
        </span>
        <div className="audience-biology-slide">
          <div className="audience-biology-slide-heading">
            <strong>{t("Plant or animal?")}</strong>
            <span>06 / 12</span>
          </div>
          <div className="audience-cell-comparison">
            <div>
              <svg
                className="audience-cell-plant"
                viewBox="0 0 100 68"
                aria-hidden="true"
              >
                <rect
                  x="9"
                  y="5"
                  width="82"
                  height="58"
                  rx="13"
                  fill="currentColor"
                  fillOpacity=".08"
                  stroke="currentColor"
                  strokeWidth="2.5"
                />
                <rect
                  x="15"
                  y="11"
                  width="70"
                  height="46"
                  rx="9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  opacity=".4"
                />
                <rect
                  x="43"
                  y="19"
                  width="28"
                  height="29"
                  rx="9"
                  fill="currentColor"
                  fillOpacity=".13"
                />
                <circle cx="30" cy="34" r="9" fill="var(--brand-lilac)" />
                <circle cx="30" cy="34" r="3" fill="var(--lilac-ink)" />
                <ellipse cx="27" cy="17" rx="6" ry="3" fill="currentColor" />
                <ellipse cx="76" cy="48" rx="6" ry="3" fill="currentColor" />
                <ellipse cx="31" cy="51" rx="6" ry="3" fill="currentColor" />
              </svg>
              <strong>{t("Plant cell")}</strong>
              <span>{t("Cell wall present")}</span>
            </div>
            <div>
              <svg
                className="audience-cell-animal"
                viewBox="0 0 100 68"
                aria-hidden="true"
              >
                <ellipse
                  cx="50"
                  cy="34"
                  rx="37"
                  ry="28"
                  fill="currentColor"
                  fillOpacity=".08"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle cx="44" cy="33" r="13" fill="var(--brand-lilac)" />
                <circle cx="44" cy="33" r="4" fill="var(--lilac-ink)" />
                <ellipse
                  cx="68"
                  cy="23"
                  rx="6"
                  ry="3"
                  fill="currentColor"
                  opacity=".4"
                  transform="rotate(-25 68 23)"
                />
                <ellipse
                  cx="64"
                  cy="48"
                  rx="6"
                  ry="3"
                  fill="currentColor"
                  opacity=".4"
                  transform="rotate(20 64 48)"
                />
                <circle
                  cx="26"
                  cy="43"
                  r="3"
                  fill="currentColor"
                  opacity=".3"
                />
              </svg>
              <strong>{t("Animal cell")}</strong>
              <span>{t("No cell wall")}</span>
            </div>
          </div>
        </div>
        <div className="audience-access-note">
          <span className="audience-access-icon">
            <Icon name="clock" size={22} />
          </span>
          <div>
            <strong>{t("You can keep asking questions for 7 days.")}</strong>
            <p>
              {t(
                "Your instructor set the assistant access period for this training.",
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

type Audience = (typeof audiences)[number];

function AudiencePanel({
  audience,
  active,
  enhanced,
  paused,
  onPause,
  reduced,
  visible,
}: {
  audience: Audience;
  active: boolean;
  enhanced: boolean;
  paused: boolean;
  onPause: () => void;
  reduced: boolean;
  visible: boolean;
}) {
  const { t } = useLocale();
  const panel = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [scene, setScene] = useState(0);
  const [sceneRestart, setSceneRestart] = useState(0);
  const running =
    inView && (!enhanced || active) && visible && !paused && !reduced;
  const selectScene = (index: number) => {
    setScene(index);
    setSceneRestart((current) => current + 1);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.3 },
    );
    if (panel.current) observer.observe(panel.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (active) {
      setScene(0);
      setSceneRestart((current) => current + 1);
    }
  }, [active]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(
      () => setScene((current) => (current + 1) % 3),
      4500,
    );
    return () => window.clearTimeout(timer);
  }, [running, scene, sceneRestart]);

  return (
    <article
      className="audience-panel"
      id={`scenario-${audience.id}`}
      aria-labelledby={`scenario-${audience.id}-title`}
      data-active={active}
      aria-hidden={enhanced && !active ? true : undefined}
      inert={enhanced && !active}
      ref={panel}
    >
      <div className="audience-copy">
        <p className="audience-profile-label">{t(audience.label)}</p>
        <h3 id={`scenario-${audience.id}-title`}>{t(audience.title)}</h3>
        <p>{t(audience.text)}</p>
        <div className="audience-benefit">
          <Icon name="check" size={19} />
          <span>{t(audience.benefit)}</span>
        </div>
      </div>
      <div className="audience-preview" data-running={running}>
        <div className="audience-preview-toolbar">
          <div
            className="audience-scene-controls"
            role="group"
            aria-label={t("Example scenes")}
          >
            {audience.scenes.map((label, index) => (
              <button
                key={label}
                type="button"
                aria-label={`${index + 1}. ${t(label)}`}
                aria-pressed={scene === index}
                onClick={() => selectScene(index)}
              >
                <span className="audience-scene-number">
                  {scene === index && (
                    <svg
                      className="audience-scene-progress"
                      key={`${scene}-${sceneRestart}`}
                      viewBox="0 0 32 32"
                      aria-hidden="true"
                    >
                      <circle cx="16" cy="16" r="14" />
                    </svg>
                  )}
                  {index + 1}
                </span>
                <span>{t(label)}</span>
              </button>
            ))}
          </div>
          {!reduced && (
            <button
              type="button"
              onClick={onPause}
              aria-label={t(paused ? "Play animation" : "Pause animation")}
              aria-pressed={paused}
              title={t(paused ? "Play animation" : "Pause animation")}
            >
              <Icon name={paused ? "play" : "pause"} size={17} />
            </button>
          )}
        </div>
        <div className="audience-demo-window" aria-hidden="true">
          <div className="audience-demo-header">
            <Icon name="file" size={18} />
            <span>{t(audience.filename)}</span>
            <span className="audience-window-dots">
              <i />
              <i />
              <i />
            </span>
          </div>
          <AudienceDemo kind={audience.id} scene={scene} />
        </div>
        <p className="sr-only">{t(audience.summary)}</p>
      </div>
    </article>
  );
}

export function LandingAudience() {
  const { t } = useLocale();
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [enhanced, setEnhanced] = useState(false);
  const section = useRef<HTMLElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const viewport = window.matchMedia(
      "(min-width: 1000px) and (min-height: 800px)",
    );
    const update = () => {
      setReduced(motion.matches);
      setEnhanced(viewport.matches && !motion.matches);
    };
    const visibility = () => setVisible(!document.hidden);
    update();
    visibility();
    motion.addEventListener("change", update);
    viewport.addEventListener("change", update);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      motion.removeEventListener("change", update);
      viewport.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  useEffect(() => {
    const container = section.current;
    const content = shell.current;
    if (!container || !content) return;
    let frame = 0;
    let inView = false;
    const measure = () => {
      if (enhanced)
        container.style.setProperty(
          "--audience-shell-height",
          `${content.offsetHeight}px`,
        );
    };
    const sizeObserver = new ResizeObserver(measure);
    if (enhanced) sizeObserver.observe(content);
    measure();
    const paint = () => {
      frame = 0;
      if (!inView) return;
      if (enhanced) {
        const top = container.getBoundingClientRect().top;
        const padding = parseFloat(getComputedStyle(container).paddingTop);
        const pin = parseFloat(getComputedStyle(content).top);
        const distance = Math.max(0, pin - top - padding);
        const next = Math.min(
          audiences.length - 1,
          Math.floor((distance + 1) / (window.innerHeight * 0.75)),
        );
        setSelected((current) => (current === next ? current : next));
      } else {
        const panels = Array.from(
          container.querySelectorAll<HTMLElement>(".audience-panel"),
        );
        const focusLine = window.innerHeight * 0.4;
        const next = panels.reduce(
          (best, panel, index) =>
            Math.abs(panel.getBoundingClientRect().top - focusLine) <
            Math.abs(panels[best].getBoundingClientRect().top - focusLine)
              ? index
              : best,
          0,
        );
        setSelected((current) => (current === next ? current : next));
      }
    };
    const schedule = () => {
      if (inView && !frame) frame = window.requestAnimationFrame(paint);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        schedule();
      },
      { rootMargin: "100px" },
    );
    observer.observe(container);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      observer.disconnect();
      sizeObserver.disconnect();
      container.style.removeProperty("--audience-shell-height");
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.cancelAnimationFrame(frame);
    };
  }, [enhanced]);

  return (
    <section
      className="landing-audience landing-container"
      id="use-cases"
      aria-labelledby={`${id}-title`}
      data-scroll-enhanced={enhanced}
      ref={section}
    >
      <div className="audience-scroll-shell" ref={shell}>
        <div className="audience-heading">
          <h2 id={`${id}-title`}>{t("Built around your training.")}</h2>
          <p>
            {t(
              "Different roles, different needs. AI agents that support practice, engagement and assessment.",
            )}
          </p>
        </div>
        <nav className="audience-tabs" aria-label={t("Instructor profiles")}>
          {audiences.map((item, index) => (
            <a
              key={item.id}
              href={`#scenario-${item.id}`}
              aria-current={selected === index ? "step" : undefined}
              onClick={(event) => {
                if (!enhanced || !section.current || !shell.current) return;
                event.preventDefault();
                const container = section.current;
                const padding = parseFloat(
                  getComputedStyle(container).paddingTop,
                );
                const pin = parseFloat(getComputedStyle(shell.current).top);
                window.scrollTo({
                  top:
                    window.scrollY +
                    container.getBoundingClientRect().top +
                    padding -
                    pin +
                    index * window.innerHeight * 0.75 +
                    2,
                  behavior: "smooth",
                });
              }}
            >
              <Icon
                name={
                  (["users", "presentation", "mic", "chart"] as const)[index]
                }
                size={20}
              />
              <span>{t(item.label)}</span>
            </a>
          ))}
        </nav>
        <div className="audience-panels">
          {audiences.map((audience, index) => (
            <AudiencePanel
              key={audience.id}
              audience={audience}
              active={selected === index}
              enhanced={enhanced}
              paused={paused}
              onPause={() => setPaused((current) => !current)}
              reduced={reduced}
              visible={visible}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

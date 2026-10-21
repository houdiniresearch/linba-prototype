"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "./locale-provider";
import { useLandingNavigation } from "./landing-navigation";
import { Icon } from "./ui";

const questions = [
  [
    "What do LİNBA’s AI agents do?",
    "Before training, practice out loud with agents representing your participants. During training, a learning agent answers participant questions using your training materials. Afterwards, review questions, activity responses and learning needs with the report agent.",
  ],
  [
    "How do practice agents adapt to my audience?",
    "Describe your audience, their experience and the training context. AI agents created from this brief join your voice practice with questions. Feedback focuses on the clarity of your delivery, your pace and how you respond.",
  ],
  [
    "What does the learning agent base its answers on?",
    "It uses the training materials you upload and points to relevant slides. Questions without an answer in the materials are passed to the instructor. You can enable or disable automatic answers during live training.",
  ],
  [
    "How does the report agent support learning assessment?",
    "It helps you examine participant questions and activity responses. Ask which topics participants struggled with and what to improve in future training. Assessment is grounded in the data collected during training; you make the training decisions.",
  ],
  [
    "Can participants keep using the learning agent after training?",
    "Yes. Participants can keep asking questions for the duration set by their instructor. Post-training questions are added to the same training report.",
  ],
  [
    "How can I try LİNBA, and what is the waitlist for?",
    "LİNBA is launching soon. Join the waitlist to be among the first to know. In the meantime, you can experience LİNBA’s AI agents for free.",
    true,
  ],
] as const;

export function LandingFaq() {
  const { t } = useLocale();
  const section = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [centered, setCentered] = useState(false);
  const { isNavigating, subscribeToSettled } = useLandingNavigation();

  useEffect(() => {
    const element = section.current;
    const shell = content.current;
    const intro = shell?.querySelector<HTMLElement>(".landing-faq-intro");
    if (!element || !shell || !intro) return;
    const viewport = matchMedia("(min-width: 1000px) and (min-height: 700px)");
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let nearby = false;
    let fits = false;
    const reset = () => shell.style.removeProperty("--faq-reveal");
    const paint = () => {
      frame = 0;
      if (isNavigating()) return;
      if (!fits || motion.matches) {
        reset();
        return;
      }
      const top =
        element.getBoundingClientRect().top +
        parseFloat(getComputedStyle(element).paddingTop);
      const start = innerHeight * 0.88;
      const end = innerHeight * 0.62;
      const progress = Math.max(0, Math.min(1, (start - top) / (start - end)));
      shell.style.setProperty("--faq-reveal", progress.toFixed(4));
    };
    const schedule = () => {
      if (nearby && !frame && !isNavigating())
        frame = requestAnimationFrame(paint);
    };
    const measure = () => {
      const header =
        document.querySelector<HTMLElement>(".landing-header-shell")
          ?.offsetHeight || 68;
      // Measure closed rows so opening an answer never recenters the heading.
      const closedHeight =
        intro.offsetHeight +
        parseFloat(getComputedStyle(intro).marginBottom) +
        [...shell.querySelectorAll("details")].reduce((height, row) => {
          const styles = getComputedStyle(row);
          return (
            height +
            row.querySelector("summary")!.offsetHeight +
            parseFloat(styles.borderTopWidth) +
            parseFloat(styles.borderBottomWidth)
          );
        }, 0);
      fits = viewport.matches && closedHeight <= innerHeight - header - 96;
      element.style.setProperty("--faq-header-height", `${header}px`);
      element.style.setProperty(
        "--faq-block-space",
        `${Math.max(48, (innerHeight - header - closedHeight) / 2)}px`,
      );
      setCentered(fits);
      if (!fits || motion.matches) reset();
      else schedule();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        nearby = entry.isIntersecting;
        if (nearby) schedule();
      },
      { rootMargin: "160px 0px" },
    );
    observer.observe(element);
    const sizes = new ResizeObserver(measure);
    sizes.observe(shell);
    measure();
    const unsubscribe = subscribeToSettled(schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);
    viewport.addEventListener("change", measure);
    motion.addEventListener("change", measure);
    return () => {
      observer.disconnect();
      sizes.disconnect();
      unsubscribe();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
      viewport.removeEventListener("change", measure);
      motion.removeEventListener("change", measure);
      element.style.removeProperty("--faq-header-height");
      element.style.removeProperty("--faq-block-space");
      reset();
    };
  }, [isNavigating, subscribeToSettled]);

  return (
    <section
      className="landing-questions landing-container"
      id="faq"
      aria-labelledby="questions-title"
      ref={section}
      data-centered={centered}
    >
      <div className="landing-faq-content" ref={content}>
        <div className="landing-faq-intro">
          <h2 id="questions-title">{t("Frequently asked questions.")}</h2>
          <p>
            {t(
              "Explore how the agents work, what they rely on and how they support your training.",
            )}
          </p>
        </div>
        <div className="landing-faq-list">
          {questions.map(([question, answer, tryLink]) => (
            <details key={question} name="landing-faq">
              <summary>
                {t(question)}
                <Icon name="plus" size={26} />
              </summary>
              <p>
                {t(answer)}
                {tryLink && (
                  <>
                    {" "}
                    <Link className="landing-faq-try" href="/login">
                      {t("Try Now, For Free!")}
                    </Link>
                  </>
                )}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

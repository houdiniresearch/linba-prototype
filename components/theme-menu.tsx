"use client";
import { useCallback, useId, useLayoutEffect, useRef, useState } from "react";
import { useLocale } from "./locale-provider";
import { useTheme } from "./theme-provider";
import { Icon } from "./ui";

const choices = [
  { value: "light", label: "Açık", icon: "sun" },
  { value: "dark", label: "Koyu", icon: "moon" },
  { value: "system", label: "Sistem", icon: "monitor" },
] as const;

export function ThemeMenu() {
  const { theme, setTheme } = useTheme();
  const { t } = useLocale();
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const positionMenu = useCallback(() => {
    if (!trigger.current || !menu.current) return;
    const button = trigger.current.getBoundingClientRect();
    const panel = menu.current.getBoundingClientRect();
    const width = panel.width || Math.min(220, window.innerWidth - 24);
    const left = Math.max(
      12,
      Math.min(button.left, window.innerWidth - width - 12),
    );
    const below = button.bottom + 8;
    const top =
      panel.height && below + panel.height > window.innerHeight - 12
        ? Math.max(12, button.top - panel.height - 8)
        : below;
    menu.current.style.left = `${left}px`;
    menu.current.style.top = `${top}px`;
  }, []);
  useLayoutEffect(() => {
    if (!open) return;
    positionMenu();
    window.addEventListener("resize", positionMenu);
    window.addEventListener("scroll", positionMenu, true);
    return () => {
      window.removeEventListener("resize", positionMenu);
      window.removeEventListener("scroll", positionMenu, true);
    };
  }, [open, positionMenu]);
  const current = choices.find((choice) => choice.value === theme)!;
  return (
    <>
      <button
        ref={trigger}
        className="header-round theme-trigger"
        popoverTarget={id}
        onClick={positionMenu}
        aria-label={`${t("Görünüm")}: ${t(current.label)}`}
        title={t("Görünüm")}
      >
        <Icon name={current.icon} size={20} />
      </button>
      <div
        id={id}
        ref={menu}
        popover="auto"
        onToggle={(event) => setOpen(event.newState === "open")}
        className="header-popover theme-popover"
        aria-label={t("Görünüm")}
      >
        <h2>{t("Görünüm")}</h2>
        {choices.map((choice) => (
          <button
            key={choice.value}
            className="popover-item theme-choice"
            aria-pressed={theme === choice.value}
            onClick={() => {
              setTheme(choice.value);
              menu.current?.hidePopover();
            }}
          >
            <Icon name={choice.icon} size={18} />
            <span>{t(choice.label)}</span>
            {theme === choice.value && <Icon name="check" size={18} />}
          </button>
        ))}
      </div>
    </>
  );
}

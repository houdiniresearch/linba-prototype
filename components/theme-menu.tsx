"use client";
import { useId, useRef } from "react";
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
  const menu = useRef<HTMLDivElement>(null);
  const current = choices.find((choice) => choice.value === theme)!;
  return (
    <>
      <button
        className="header-round theme-trigger"
        popoverTarget={id}
        aria-label={`${t("Görünüm")}: ${t(current.label)}`}
        title={t("Görünüm")}
      >
        <Icon name={current.icon} size={20} />
      </button>
      <div
        id={id}
        ref={menu}
        popover="auto"
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

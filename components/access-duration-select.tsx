"use client";
import { limitLearningAccessDays } from "@/lib/training-access";
import { ProductSelect } from "./product-select";
import { useProductLocale as useLocale } from "./product-locale";

const presets = [0, 1, 3, 7, 14, 30];

/** Keep existing non-preset durations selectable without asking people to type days. */
export function AccessDurationSelect({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (days: number) => void;
  disabled?: boolean;
}) {
  const { t } = useLocale();
  const duration = limitLearningAccessDays(value);
  const choices = presets.includes(duration)
    ? presets
    : [...presets, duration].sort((a, b) => a - b);
  return (
    <label>
      {t("Learning agent access after training")}
      <ProductSelect
        label={t("Learning agent access after training")}
        value={String(duration)}
        onChange={(days) => onChange(Number(days))}
        disabled={disabled}
        options={choices.map((days) => ({
          value: String(days),
          label:
            days === 0
              ? t("Close when the presentation ends")
              : days === 1
                ? t("1 day")
                : t("{days} days", { days }),
        }))}
      />
      <small>
        {t("Access starts when the presentation ends. Maximum 30 days.")}
      </small>
    </label>
  );
}

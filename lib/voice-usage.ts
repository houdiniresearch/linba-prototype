export type UsageStage = "personas" | "conversation" | "speech" | "preview";
export type TokenUsage = {
  input_tokens?: number;
  output_tokens?: number;
  input_token_details?: {
    text_tokens?: number;
    audio_tokens?: number;
    cached_tokens?: number;
    cached_tokens_details?: { text_tokens?: number; audio_tokens?: number };
  };
  output_token_details?: { text_tokens?: number; audio_tokens?: number };
};
export type UsageEntry = {
  id: string;
  stage: UsageStage;
  model: string;
  usage: TokenUsage;
};
const amount = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0;
export function cleanUsage(value: TokenUsage): TokenUsage {
  const i = value.input_token_details,
    o = value.output_token_details;
  return {
    input_tokens: amount(value.input_tokens),
    output_tokens: amount(value.output_tokens),
    input_token_details: {
      text_tokens: amount(i?.text_tokens),
      audio_tokens: amount(i?.audio_tokens),
      cached_tokens: amount(i?.cached_tokens),
      cached_tokens_details: {
        text_tokens: amount(i?.cached_tokens_details?.text_tokens),
        audio_tokens: amount(i?.cached_tokens_details?.audio_tokens),
      },
    },
    output_token_details: {
      text_tokens: amount(o?.text_tokens),
      audio_tokens: amount(o?.audio_tokens),
    },
  };
}
export function appendUsage(entries: UsageEntry[], entry: UsageEntry) {
  return entries.some((e) => e.id === entry.id)
    ? entries
    : [...entries, { ...entry, usage: cleanUsage(entry.usage) }];
}
// USD / million tokens, official GPT-Realtime-2.1 Mini rates checked 2026-10-15.
export const PRICE_DATE = "15 Ekim 2026";
export function usageCost(entry: UsageEntry): number | null {
  if (entry.model !== "gpt-realtime-2.1-mini") return null;
  const u = cleanUsage(entry.usage),
    i = u.input_token_details!,
    o = u.output_token_details!,
    c = i.cached_tokens_details!;
  if (
    i.text_tokens! + i.audio_tokens! < u.input_tokens! ||
    o.text_tokens! + o.audio_tokens! < u.output_tokens! ||
    c.text_tokens! + c.audio_tokens! < i.cached_tokens!
  )
    return null;
  const ct = Math.min(i.text_tokens!, c.text_tokens!),
    ca = Math.min(i.audio_tokens!, c.audio_tokens!);
  return (
    ((i.text_tokens! - ct) * 0.6 +
      ct * 0.06 +
      (i.audio_tokens! - ca) * 10 +
      ca * 0.3 +
      o.text_tokens! * 2.4 +
      o.audio_tokens! * 20) /
    1e6
  );
}
export function usageSummary(entries: UsageEntry[]) {
  const total = entries.reduce((s, e) => s + (usageCost(e) ?? 0), 0);
  const extra = entries
    .filter((e) => e.stage === "speech")
    .reduce((s, e) => s + (usageCost(e) ?? 0), 0);
  const previews = entries
    .filter((e) => e.stage === "preview")
    .reduce((s, e) => s + (usageCost(e) ?? 0), 0);
  return {
    total,
    extra,
    previews,
    known: entries.every((e) => usageCost(e) !== null),
    input: entries.reduce((s, e) => s + amount(e.usage.input_tokens), 0),
    output: entries.reduce((s, e) => s + amount(e.usage.output_tokens), 0),
  };
}

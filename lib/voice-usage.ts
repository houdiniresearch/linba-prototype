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
export const PRICE_DATE = "21 Ekim 2026";
export function usageCost(entry: UsageEntry): number | null {
  if (/^gpt-5\.4-mini(?:-2026-03-17)?$/u.test(entry.model)) {
    const u = cleanUsage(entry.usage);
    const cached = Math.min(
      u.input_tokens || 0,
      u.input_token_details?.cached_tokens || 0,
    );
    return (
      (((u.input_tokens || 0) - cached) * 0.75 +
        cached * 0.075 +
        (u.output_tokens || 0) * 4.5) /
      1e6
    );
  }
  if (!["gpt-realtime-2.1-mini", "gpt-realtime-2.1"].includes(entry.model))
    return null;
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
  const price =
    entry.model === "gpt-realtime-2.1"
      ? {
          text: 4,
          cachedText: 0.4,
          audio: 32,
          cachedAudio: 0.4,
          outText: 24,
          outAudio: 64,
        }
      : {
          text: 0.6,
          cachedText: 0.06,
          audio: 10,
          cachedAudio: 0.3,
          outText: 2.4,
          outAudio: 20,
        };
  return (
    ((i.text_tokens! - ct) * price.text +
      ct * price.cachedText +
      (i.audio_tokens! - ca) * price.audio +
      ca * price.cachedAudio +
      o.text_tokens! * price.outText +
      o.audio_tokens! * price.outAudio) /
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

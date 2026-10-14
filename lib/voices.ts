import type { Persona } from "./types";

export type VoiceStyle = "female" | "male" | "neutral";
export const VOICES = [
  { id: "marin", name: "Marin", style: "female" },
  { id: "coral", name: "Coral", style: "female" },
  { id: "sage", name: "Sage", style: "female" },
  { id: "shimmer", name: "Shimmer", style: "female" },
  { id: "cedar", name: "Cedar", style: "male" },
  { id: "ash", name: "Ash", style: "male" },
  { id: "ballad", name: "Ballad", style: "male" },
  { id: "echo", name: "Echo", style: "male" },
  { id: "verse", name: "Verse", style: "male" },
  { id: "alloy", name: "Alloy", style: "neutral" },
] as const;
export type VoiceId = (typeof VOICES)[number]["id"];
// Product listening categories, not gender labels supplied by the provider.
export const VOICE_STYLE_LABELS: Record<VoiceStyle, string> = {
  female: "Kadın tınılı",
  male: "Erkek tınılı",
  neutral: "Nötr",
};
export function voiceStyle(value: unknown): VoiceStyle {
  return value === "female" || value === "male" ? value : "neutral";
}
export function voicesFor(style: VoiceStyle) {
  return VOICES.filter((v) => v.style === style);
}
export function assignVoices(personas: Persona[]): Persona[] {
  const count = { female: 0, male: 0, neutral: 0 };
  return personas.map((p) => {
    const gender = voiceStyle(p.gender);
    const pool = voicesFor(gender);
    const fallback = pool[count[gender]++ % pool.length];
    return {
      ...p,
      gender,
      voice: pool.find((v) => v.id === p.voice)?.id || fallback.id,
    };
  });
}
export function personaVoice(persona: Persona): VoiceId {
  return assignVoices([persona])[0].voice!;
}
export function parsePersonaTurn(raw: string, count: number) {
  const value = JSON.parse(
    raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1),
  );
  if (value.speak === false) return null;
  if (
    !Number.isInteger(value.personaIndex) ||
    value.personaIndex < 0 ||
    value.personaIndex >= count ||
    typeof value.text !== "string" ||
    !value.text.trim()
  )
    throw new Error(
      "Katılımcı yanıtı anlaşılamadı. Anlatımına devam edebilirsin.",
    );
  return {
    personaIndex: value.personaIndex as number,
    text: value.text.trim().slice(0, 900),
  };
}

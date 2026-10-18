import type { Persona } from "./types";
import { isParticipantRoleLeak } from "./rehearsal-prompts";

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
  female: "Feminine",
  male: "Masculine",
  neutral: "Neutral",
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
  if (!raw.trim()) return null;
  let value;
  try {
    value = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
  } catch {
    throw new Error("PARTICIPANT_TURN_INVALID");
  }
  if (!value || typeof value !== "object")
    throw new Error("PARTICIPANT_TURN_INVALID");
  if (
    typeof value.teacherTail === "string" &&
    teacherKeepsFloor(value.teacherTail)
  )
    return null;
  if (value.speak === false) return null;
  if (
    !Number.isInteger(value.personaIndex) ||
    value.personaIndex < 0 ||
    value.personaIndex >= count ||
    typeof value.text !== "string" ||
    !value.text.trim()
  )
    throw new Error("PARTICIPANT_TURN_INVALID");
  if (isParticipantRoleLeak(value.text))
    throw new Error("PARTICIPANT_ROLE_LEAK");
  return {
    personaIndex: value.personaIndex as number,
    text: value.text.trim().slice(0, 900),
  };
}

export function teacherKeepsFloor(tail: string) {
  const text = tail.trim().slice(-500);
  if (/^APP_(?:CONTEXT|PLAYBACK)\b/u.test(text)) return true;
  if (text.endsWith("?")) return false;
  return /(?:bir dakika|bir saniye|biraz)\s+(?:(?:beni|bizi|sadece|lütfen)\s+){0,2}(?:dinleyin|bekleyin|bekleyelim)|(?:şimdi|önce)\s+(?:beni\s+)?(?:dinleyin|bekleyin)|soruları.{0,40}(?:bitirince|bitince|sonra).{0,20}(?:alacağım|alalım)|(?:örneği|cümlemi|anlatımımı).{0,20}(?:bitireyim|tamamlayayım)/iu.test(
    text,
  );
}

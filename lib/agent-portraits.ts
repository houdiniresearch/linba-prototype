import type { Persona } from "./types";

export const PORTRAIT_IDS = Array.from(
  { length: 6 },
  (_, i) => `portrait-${String(i + 1).padStart(2, "0")}`,
);

function hash(value: string) {
  let result = 0;
  for (const letter of value)
    result = (result * 31 + letter.charCodeAt(0)) >>> 0;
  return result;
}

/** Fictional identities; an explicit initial voice style can suggest a portrait pool.
 * Existing identities always win, including after a voice change. Never infer from names. */
export function assignPortraits(
  personas: Persona[],
  sessionId: string,
): Persona[] {
  const reserved = new Set(
    personas
      .map((p) => p.portraitId)
      .filter((id) => PORTRAIT_IDS.includes(id || "")),
  );
  return personas.map((persona, index) => {
    if (persona.portraitId && PORTRAIT_IDS.includes(persona.portraitId))
      return persona;
    const offset = hash(`${sessionId}:${index}`) % PORTRAIT_IDS.length;
    const ordered = [
      ...PORTRAIT_IDS.slice(offset),
      ...PORTRAIT_IDS.slice(0, offset),
    ];
    const preferred =
      persona.gender === "female"
        ? PORTRAIT_IDS.slice(0, 3)
        : persona.gender === "male"
          ? PORTRAIT_IDS.slice(3)
          : PORTRAIT_IDS;
    const portraitId =
      ordered.find((id) => preferred.includes(id) && !reserved.has(id)) ||
      ordered.find((id) => !reserved.has(id)) ||
      ordered[0];
    reserved.add(portraitId);
    return { ...persona, portraitId };
  });
}

export function portraitSource(portraitId?: string) {
  const id = PORTRAIT_IDS.includes(portraitId || "")
    ? portraitId
    : PORTRAIT_IDS[0];
  return `/agents/portraits/${id}.webp`;
}

import { get, put } from "./db";
import type { Rehearsal } from "./types";
import { appendUsage, type UsageEntry } from "./voice-usage";
export async function recordRehearsalUsage(id: string, entry: UsageEntry) {
  const current = await get<Rehearsal>("rehearsal", id);
  if (!current) return;
  current.usage = appendUsage(current.usage || [], entry);
  return await put("rehearsal", current);
}

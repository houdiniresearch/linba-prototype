import { get, put } from "./db";
import type { Rehearsal } from "./types";
import { appendUsage, type UsageEntry } from "./voice-usage";
export function recordRehearsalUsage(id: string, entry: UsageEntry) {
  const current = get<Rehearsal>("rehearsal", id);
  if (!current) return;
  current.usage = appendUsage(current.usage || [], entry);
  return put("rehearsal", current);
}

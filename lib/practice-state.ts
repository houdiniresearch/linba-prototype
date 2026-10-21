/** UI states describe the audio session, never a participant's emotions. */
export type PracticeVoiceState =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "rendering"
  | "speaking"
  | "disconnected"
  | "feedback"
  | "ended";

export function practiceIsConnected(state: PracticeVoiceState) {
  return ["listening", "thinking", "rendering", "speaking"].includes(state);
}

export function practiceAgentStatus(
  state: PracticeVoiceState,
  index: number,
  speaker: number | null,
  micMuted = false,
) {
  if (state === "ended" || state === "feedback") return "Session ended";
  if (state === "disconnected") return "Offline";
  if (state === "connecting") return "Connecting…";
  if (state === "thinking") return "Thinking";
  if (speaker === index && state === "speaking") return "Speaking";
  if (speaker === index && state === "rendering") return "Preparing to speak";
  if (state === "speaking" || state === "rendering") return "Waiting";
  return state === "listening" ? (micMuted ? "Waiting" : "Listening") : "Ready";
}

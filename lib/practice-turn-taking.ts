/** Realtime may detect turns, but background sound must never interrupt an agent. */
export function practiceTurnDetection(createResponse = true) {
  return {
    type: "semantic_vad" as const,
    eagerness: "low" as const,
    create_response: createResponse,
    interrupt_response: false,
  };
}

/** One owner of microphone transmission, independent of React render timing. */
export class PracticeTurnTaking {
  private active = false;
  private held = true;
  muted = false;
  constructor(
    private io: {
      microphone(enabled: boolean): void;
      automaticResponses(enabled: boolean): void;
      clearInput(): void;
    },
  ) {}
  get acceptsSpeech() {
    return this.active && !this.held && !this.muted;
  }
  start() {
    this.active = true;
    this.muted = false;
    this.hold();
  }
  hold() {
    this.held = true;
    this.io.microphone(false);
    if (this.active) {
      this.io.automaticResponses(false);
      this.io.clearInput();
    }
  }
  listen() {
    if (!this.active) return;
    // Discard buffered noise before restoring turn detection and microphone.
    this.io.clearInput();
    this.io.automaticResponses(true);
    this.held = false;
    this.io.microphone(!this.muted);
  }
  setMuted(value: boolean) {
    this.muted = value;
    this.io.microphone(this.acceptsSpeech);
    if (value && this.active) this.io.clearInput();
  }
  stop() {
    this.active = false;
    this.held = true;
    this.io.microphone(false);
  }
}

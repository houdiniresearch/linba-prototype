export type Role = "teacher" | "participant";
export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  demo?: boolean;
  guest?: boolean;
};
export type Page = {
  id: string;
  number: number;
  title: string;
  text: string;
  image: string;
  ratio: number;
};
export type Activity = {
  type: "poll" | "true-false" | "open" | "scenario";
  question: string;
  options: string[];
  aiGenerated?: boolean;
};
export type Slide = {
  id: string;
  kind: "document" | "activity";
  pageId?: string;
  activity?: Activity;
  notes?: string;
};
export type Course = {
  id: string;
  showcase?: {
    pack: "bigg-v1";
    key: "customer" | "market";
    theme: "light" | "dark";
  };
  reportTeamId?: string;
  /** List projection flag; a shared report grants no presentation editing rights. */
  sharedReport?: boolean;
  reportAuthorName?: string;
  createdBy?: string;
  trainingId?: string;
  sessionNumber?: number;
  groupId?: string;
  trashedAt?: string;
  ownerId: string;
  name: string;
  originalName: string;
  coverPage?: number;
  createdAt: string;
  accessDays: number;
  autoAnswer: boolean;
  code: string;
  displayKey: string;
  status: "draft" | "live" | "ended";
  startedAt?: string;
  endedAt?: string;
  /** A break pauses the clock without ending the presentation. */
  pausedAt?: string;
  pausedDurationMs?: number;
  pages: Page[];
  slides: Slide[];
  activeSlideId: string;
  slideVersion: number;
  report?: {
    summary: string;
    recommendations: string[];
    updatedAt: string;
    ai: boolean;
    source?: "showcase";
    status?: "pending" | "ready" | "error";
    generationId?: string;
    generationStartedAt?: string;
    inputKey?: string;
  };
};
export type Question = {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  text: string;
  answer?: string;
  status: "pending" | "answered" | "escalated" | "manual";
  reason?: string;
  groupId: string;
  groupTitle: string;
  sources: number[];
  createdAt: string;
  stage: "live" | "followup";
  addressed?: boolean;
  /** Private conversational replies never enter instructor questions or analytics. */
  conversationOnly?: boolean;
};
export type ActivityResponse = {
  id: string;
  courseId: string;
  slideId: string;
  userId: string;
  userName: string;
  value: string;
  createdAt: string;
};
export type Persona = {
  portraitId?: string;
  name: string;
  background: string;
  behavior: string;
  priorKnowledge?: string;
  learningGoal?: string;
  misconception?: string;
  speakingStyle?: string;
  gender?: import("./voices").VoiceStyle;
  voice?: import("./voices").VoiceId;
};
export type Rehearsal = {
  id: string;
  courseId: string;
  audience: string;
  voiceExpiresAt?: string;
  promptVersion?: string;
  personas: Persona[];
  createdAt: string;
  endedAt?: string;
  durationSeconds?: number;
  remarks: string[];
  usage?: import("./voice-usage").UsageEntry[];
  feedback?: { summary: string; suggestions: string[]; questions: string[] };
};
export type CourseState = {
  canManage?: boolean;
  course: Course;
  questions: Question[];
  responses: ActivityResponse[];
  participants: { id: string; name: string }[];
  rehearsals: Rehearsal[];
  aiReady: boolean;
  model: string;
};

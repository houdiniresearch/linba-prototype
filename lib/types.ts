export type Role = "teacher" | "participant";
export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  demo?: boolean;
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
  type: "poll" | "open" | "scenario";
  question: string;
  options: string[];
  aiGenerated?: boolean;
};
export type Slide = {
  id: string;
  kind: "document" | "activity";
  pageId?: string;
  activity?: Activity;
};
export type Course = {
  id: string;
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
  pages: Page[];
  slides: Slide[];
  activeSlideId: string;
  slideVersion: number;
  report?: {
    summary: string;
    recommendations: string[];
    updatedAt: string;
    ai: boolean;
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
  promptVersion?: string;
  personas: Persona[];
  createdAt: string;
  endedAt?: string;
  remarks: string[];
  usage?: import("./voice-usage").UsageEntry[];
  feedback?: { summary: string; suggestions: string[]; questions: string[] };
};
export type CourseState = {
  course: Course;
  questions: Question[];
  responses: ActivityResponse[];
  participants: { id: string; name: string }[];
  rehearsals: Rehearsal[];
  aiReady: boolean;
  model: string;
};

import {
  MAX_LEARNING_ACCESS_DAYS,
  limitLearningAccessDays,
} from "@/lib/training-access";
import { isShowcase, seedShowcaseRecords } from "@/lib/showcase";
import { setPresentationPaused } from "@/lib/presentation-clock";
import {
  PRACTICE_LIMIT_SECONDS,
  practiceBudgetReached,
} from "@/lib/practice-clock";
import { after } from "next/server";
import { practiceTurnDetection } from "@/lib/practice-turn-taking";
import { ensureShowcaseWorkspace } from "@/lib/showcase-install";
import { randomUUID } from "node:crypto";
import { saveFeedback } from "@/lib/feedback";
import {
  acceptTeamInvite,
  canReadReport,
  canManagePresentation,
  createTeam,
  createTeamInvite,
  inspectTeamInvite,
  removeTeamMember,
  renameTeam,
  requireReport,
  revokeTeamInvite,
  teamState,
  workspaceCourses,
  transferTeamOwnership,
} from "@/lib/teams";
import {
  repeatTraining,
  openPresentationWorkspace,
} from "@/lib/repeat-training";
import {
  trainingGroups,
  saveTrainingGroup,
  removeTrainingGroup,
  updateTrainingLibrary,
  trainingFolderId,
} from "@/lib/workspace-library";
import {
  accountSettings,
  updateProfile,
  updateAccountPassword,
} from "@/lib/account-settings";
import {
  readPresentationAsset,
  discardPresentationAssets,
} from "@/lib/presentation-storage";
import {
  queuePresentationIndex,
  indexPresentation,
  presentationIndexState,
} from "@/lib/document-index";
import { usesSupabase } from "@/lib/supabase-server";
import {
  createPresentationUpload,
  presentationUpload,
  uploadedPresentationFile,
  completePresentationUpload,
  cleanupPresentationUpload,
} from "@/lib/presentation-upload";
import { localAddresses, joinOrigin } from "@/lib/network";
import { hasDuplicateOptions, isChoiceActivity } from "@/lib/activities";
import {
  joinPublicWaitlist,
  joinWaitlist,
  waitlistEntry,
} from "@/lib/waitlist";
import { get, all, put, transaction, withDatabaseReadCache } from "@/lib/db";
import {
  AppError,
  apiError,
  checkOrigin,
  currentUser,
  currentParticipant,
  requireParticipant,
  requireUser,
  setSession,
  logout,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import {
  joinAsGuest,
  joinablePresentation,
  joinPresentation,
} from "@/lib/participant-join";
import {
  createCourse,
  courseForOwner,
  stateFor,
  stateForReport,
  canChat,
  memberOf,
  questionsOf,
  activeSlide,
  validateSlideOrder,
  participantQuestion,
} from "@/lib/courses";
import { demoPages, processDocument } from "@/lib/documents";
import { learningConversationReply } from "@/lib/learning-conversation";
import {
  aiReady,
  modelName,
  speechModelName,
  textModelName,
  answerQuestion,
  generateActivity,
  activitySourcePage,
  createPersonas,
  groupQuestion,
} from "@/lib/ai";
import {
  prepareReportGeneration,
  runReportGeneration,
  reportCourse,
  reportNeedsRefresh,
} from "@/lib/reports";
import { reportList, reportChat, sendReportMessage } from "@/lib/report-chat";
import { VOICES, assignVoices, personaVoice, voiceStyle } from "@/lib/voices";
import { cleanUsage, type UsageEntry } from "@/lib/voice-usage";
import { recordRehearsalUsage } from "@/lib/rehearsal-usage";
import { assignPortraits } from "@/lib/agent-portraits";
import { personaSpeech } from "@/lib/persona-speech";
import { participantLineValid } from "@/lib/participant-quality";
import { practiceTurnIsConcise } from "@/lib/practice-quality";
import { practiceFeedbackContract } from "@/lib/ai-contracts";
import {
  buildRehearsalInstructions,
  REHEARSAL_PROMPT_VERSION,
  participantTools,
} from "@/lib/rehearsal-prompts";
import type { Course, User, Question, Activity, Rehearsal } from "@/lib/types";
export const runtime = "nodejs";
export const maxDuration = 240;
type Context = {
  params: Promise<{
    path: string[];
  }>;
};
const json = (value: unknown) =>
  Response.json(value, { headers: { "Cache-Control": "no-store" } });
const text = (value: unknown, max = 3000) =>
  String(value ?? "")
    .trim()
    .slice(0, max);
function accessDays(value: unknown) {
  const days = Number(value);
  if (!Number.isInteger(days) || days < 0 || days > MAX_LEARNING_ACCESS_DAYS)
    throw new AppError("Access must be between 0 and 30 days.");
  return days;
}
function activity(value: Activity): Activity {
  if (
    !value ||
    !["poll", "true-false", "open", "scenario"].includes(value.type) ||
    !text(value.question)
  )
    throw new AppError("Enter the activity question.");
  const options = Array.isArray(value.options)
    ? value.options
        .map((v) => text(v, 200))
        .filter(Boolean)
        .slice(0, 6)
    : [];
  if (isChoiceActivity(value.type) && options.length < 2)
    throw new AppError("Enter at least two poll options.");
  if (isChoiceActivity(value.type) && hasDuplicateOptions(options))
    throw new AppError(
      "Poll options must be different. Change the duplicate option.",
    );
  if (
    value.type === "true-false" &&
    !["True|False", "Doğru|Yanlış"].includes(options.join("|"))
  )
    throw new AppError("Use the fixed True and False options.");
  return {
    type: value.type,
    question: text(value.question),
    options,
    aiGenerated: !!value.aiGenerated,
  };
}
async function handle(request: Request, context: Context): Promise<Response> {
  try {
    const parts = (await context.params).path,
      method = request.method,
      url = new URL(request.url);
    const participantScope = parts[0] === "participant";
    if (participantScope) {
      parts.shift();
      if (!["auth", "join", "courses"].includes(parts[0]))
        throw new AppError("Resource not found.", 404);
    }
    if (method !== "GET") checkOrigin(request);
    if (parts[0] === "auth") {
      if (method === "GET") {
        const user = participantScope
          ? await currentParticipant()
          : await currentUser();
        if (user?.demo && user.role === "teacher")
          await ensureShowcaseWorkspace(user);
        return json({
          user,
          aiReady: aiReady(),
          model: modelName(),
        });
      }
      if (method === "DELETE") {
        await logout(participantScope ? "participant" : "main");
        return json({ ok: true });
      }
      if (method !== "POST")
        throw new AppError("This action is not supported.", 405);
      const body = await request.json();
      if (body.action === "demo") {
        if (participantScope)
          throw new AppError("This action is not supported.", 405);
        const user: User = {
          id: randomUUID(),
          name: "BIGG",
          email: "",
          role: "teacher",
          demo: true,
        };
        await put("user", user);
        const presentations = await ensureShowcaseWorkspace(user);
        await setSession(user);
        const course = (await get<Course>(
          "course",
          presentations[0].courseId,
        ))!;
        return json({ user, course });
      }
      const email = text(body.email, 254).toLowerCase(),
        password = String(body.password || "");
      if (
        !/^\S+@\S+\.\S+$/.test(email) ||
        password.length < 8 ||
        password.length > 128
      )
        throw new AppError(
          "Enter a valid email and a password of at least 8 characters.",
        );
      const existing = (
        await all<
          User & {
            password: string;
          }
        >("user")
      ).find((u) => u.email === email);
      let user: User;
      if (body.action === "register") {
        if (existing)
          throw new AppError(
            "This email is already registered. You can log in.",
          );
        if (
          !["teacher", "participant"].includes(body.role) ||
          !text(body.name, 80)
        )
          throw new AppError("Enter your name and choose an account type.");
        user = {
          id: randomUUID(),
          name: text(body.name, 80),
          email,
          role: participantScope ? "participant" : body.role,
        };
        await put("user", { ...user, password: hashPassword(password) });
      } else {
        if (!existing?.password || !verifyPassword(password, existing.password))
          throw new AppError("The email or password is incorrect.", 401);
        user = {
          id: existing.id,
          name: existing.name,
          email,
          role: existing.role,
        };
      }
      if (participantScope && user.role !== "participant")
        throw new AppError("Sign in as a participant to join training.", 403);
      await setSession(user, participantScope ? "participant" : "main");
      return json({ user });
    }
    if (
      participantScope &&
      parts[0] === "join" &&
      parts.length === 1 &&
      method === "POST"
    ) {
      const body = await request.json();
      if (body.asGuest === true) {
        const result = await joinAsGuest(body, await currentParticipant());
        await setSession(result.user, "participant");
        return json(result);
      }
      const user = await requireParticipant();
      return json({
        id: await joinPresentation(await joinablePresentation(body.code), user),
        user,
      });
    }
    if (parts[0] === "presentation" && method === "GET") {
      const c = await get<Course>("course", parts[1]);
      if (!c || c.trashedAt || url.searchParams.get("key") !== c.displayKey)
        throw new AppError("The presentation link is invalid.", 404);
      return json({
        course: {
          ...c,
          ownerId: "",
          displayKey: "",
          report: undefined,
          slides: c.slides.map(({ notes: _notes, ...slide }) => slide),
          pages: c.pages.map((p) => ({ ...p, text: "" })),
        },
        joinOrigin: joinOrigin(request),
      });
    }
    // Projection links carry a scoped token and never expose conversations or reports.
    if (
      parts[0] === "courses" &&
      parts[2] === "page" &&
      method === "GET" &&
      url.searchParams.has("key")
    ) {
      const c = await get<Course>("course", parts[1]);
      if (!c || c.trashedAt || url.searchParams.get("key") !== c.displayKey)
        throw new AppError("The presentation link is invalid.", 404);
      const page = c.pages.find((p) => p.number === Number(parts[3]));
      if (!page) throw new AppError("Slide not found.", 404);
      return new Response(
        new Uint8Array(
          await readPresentationAsset(c.id, page.image, c.showcase),
        ),
        {
          headers: {
            "Content-Type": page.image.endsWith(".svg")
              ? "image/svg+xml"
              : "image/png",
            "Cache-Control": "private, max-age=3600",
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy":
              "default-src 'none'; style-src 'unsafe-inline'",
          },
        },
      );
    }
    if (
      ["public-waitlist", "integration-waitlist"].includes(parts[0]) &&
      parts.length === 1
    ) {
      if (method !== "POST")
        throw new AppError("This action is not supported.", 405);
      const body = await request.json();
      await joinPublicWaitlist(body.email, body.locale);
      return json({ ok: true });
    }
    if (parts[0] === "team-invites" && parts.length === 2 && method === "GET") {
      const { invite, team } = await inspectTeamInvite(parts[1]);
      return json({
        teamName: team.name,
        email: invite.email,
        expiresAt: invite.expiresAt,
      });
    }
    const user = participantScope
      ? await requireParticipant()
      : await requireUser();
    if (parts[0] === "uploads" && parts.length === 1 && method === "POST")
      return json(await createPresentationUpload(user, await request.json()));
    if (participantScope && parts[0] === "courses") {
      // A teacher cookie may coexist in this browser. It must never authorize
      // management actions made through the participant surface.
      const reading =
        method === "GET" &&
        (parts.length === 2 || (parts.length === 4 && parts[2] === "page"));
      const responding =
        method === "POST" &&
        parts.length === 3 &&
        ["questions", "responses"].includes(parts[2]);
      if (!reading && !responding)
        throw new AppError(
          "This area is unavailable for this account type.",
          403,
        );
    }
    if (
      parts[0] === "team-invites" &&
      parts.length === 2 &&
      method === "POST"
    ) {
      return json({ team: await acceptTeamInvite(user, parts[1]) });
    }
    if (parts[0] === "team") {
      if (parts.length === 1) {
        if (method === "GET")
          return json(
            await teamState(user, url.searchParams.get("summary") === "1"),
          );
        if (method === "POST") {
          await createTeam(user, (await request.json()).name);
          return json(await teamState(user));
        }
        if (method === "PATCH") {
          await renameTeam(user, (await request.json()).name);
          return json(await teamState(user));
        }
      }
      if (parts[1] === "invites") {
        if (parts.length === 2 && method === "POST")
          return json(
            await createTeamInvite(user, (await request.json()).email),
          );
        if (parts.length === 3 && method === "DELETE") {
          await revokeTeamInvite(user, parts[2]);
          return json({ ok: true });
        }
      }
      if (parts[1] === "members" && parts.length === 3 && method === "DELETE") {
        await removeTeamMember(user, parts[2]);
        return json({ ok: true });
      }
      if (parts[1] === "owner" && parts.length === 2 && method === "PATCH") {
        await transferTeamOwnership(user, (await request.json()).userId);
        return json({ ok: true });
      }
      throw new AppError("This action is not supported.", 405);
    }
    if (
      parts[0] === "reports" &&
      ((parts.length === 2 && method === "GET") ||
        (parts.length === 3 && parts[2] === "generate" && method === "POST"))
    ) {
      await requireReport(user, parts[1]);
      if (
        method === "POST" ||
        (await reportNeedsRefresh((await reportCourse(parts[1]))!))
      ) {
        const generation = await prepareReportGeneration(parts[1]);
        if (generation) after(() => runReportGeneration(parts[1], generation));
      }
      return json(await stateForReport((await reportCourse(parts[1]))!, user));
    }
    if (parts[0] === "account" && parts.length === 1) {
      if (method === "GET") return json(await accountSettings(user));
      if (method === "PATCH")
        return json({ user: await updateProfile(user, await request.json()) });
      if (method === "POST") {
        await updateAccountPassword(user, await request.json());
        await setSession(user);
        return json({ ok: true });
      }
      throw new AppError("This action is not supported.", 405);
    }
    if (parts[0] === "groups" && parts.length <= 2) {
      if (method === "GET" && parts.length === 1)
        return json({ groups: await trainingGroups(user) });
      if (method === "POST" && parts.length === 1)
        return json({
          group: await saveTrainingGroup(user, (await request.json()).name),
        });
      if (method === "PATCH" && parts.length === 2)
        return json({
          group: await saveTrainingGroup(
            user,
            (await request.json()).name,
            parts[1],
          ),
        });
      if (method === "DELETE" && parts.length === 2) {
        await removeTrainingGroup(user, parts[1]);
        return json({ ok: true });
      }
      throw new AppError("This action is not supported.", 405);
    }
    if (parts[0] === "feedback" && parts.length === 1) {
      if (method !== "POST")
        throw new AppError("This action is not supported.", 405);
      const entry = await saveFeedback(user, await request.json());
      return json({ id: entry.id });
    }
    if (parts[0] === "report-assistant") {
      if (parts.length === 1 && method === "GET")
        return json({ reports: await reportList(user) });
      if (parts.length === 2) {
        if (method === "GET") return json(await reportChat(user, parts[1]));
        if (method === "POST")
          return json(
            await sendReportMessage(user, parts[1], await request.json()),
          );
      }
      throw new AppError("This action is not supported.", 405);
    }
    if (parts[0] === "waitlist" && parts.length === 1) {
      if (method === "GET")
        return json({ entry: (await waitlistEntry(user.id)) || null });
      if (method === "POST") {
        const body = await request.json();
        return json({
          entry: await joinWaitlist(user.id, body.email, body.locale),
        });
      }
      throw new AppError("This action is not supported.", 405);
    }
    if (parts[0] === "status" && method === "GET") {
      const addresses = localAddresses();
      return json({
        aiReady: aiReady(),
        model: modelName(),
        addresses,
        joinOrigin: joinOrigin(request),
      });
    }
    if (parts[0] === "join" && method === "POST") {
      if (user.role !== "participant")
        throw new AppError("Sign in as a participant to join training.", 403);
      const body = await request.json();
      const course = (await all<Course>("course")).find(
        (c) => c.code === text(body.code, 6),
      );
      if (
        !course ||
        course.trashedAt ||
        (!canChat(course) && course.status !== "draft")
      )
        throw new AppError(
          "Training was not found or access has expired.",
          404,
        );
      await put("member", {
        id: `${course.id}:${user.id}`,
        courseId: course.id,
        userId: user.id,
        name: user.name,
      });
      return json({ id: course.id });
    }
    if (parts[0] !== "courses") throw new AppError("Resource not found.", 404);
    if (parts.length === 1) {
      if (method === "GET") {
        if (user.demo && user.role === "teacher")
          await ensureShowcaseWorkspace(user);
        return json({
          courses: await Promise.all(
            (await workspaceCourses(user)).map(async (c) => ({
              ...c,
              accessDays: limitLearningAccessDays(c.accessDays),
              displayKey: "",
              coverPage: c.pages[0]?.number,
              pages: [],
              slides: [],
              ownerId: "",
              createdBy: (await get<User>("user", c.ownerId))?.name || "",
            })),
          ),
        });
      }
      await requireUser("teacher");
      if (method !== "POST")
        throw new AppError("This action is not supported.", 405);
      const id = randomUUID();
      let name: string,
        originalName: string,
        days: number,
        auto: boolean,
        pages,
        upload: Awaited<ReturnType<typeof presentationUpload>> | undefined,
        folderId: string | undefined;
      if (
        request.headers.get("content-type")?.includes("multipart/form-data")
      ) {
        const form = await request.formData(),
          file = form.get("file");
        if (!(file instanceof File))
          throw new AppError("Choose your presentation file.");
        name = text(form.get("name"), 120) || file.name.replace(/\.[^.]+$/, "");
        originalName = file.name;
        days = accessDays(form.get("accessDays"));
        auto = form.get("autoAnswer") === "true";
        folderId = await trainingFolderId(user, form.get("folderId"));
        pages = await processDocument(id, file);
      } else {
        const body = await request.json();
        if (!body.demo && !body.uploadId)
          throw new AppError("Choose your presentation file.");
        days = accessDays(body.accessDays ?? 7);
        auto = body.autoAnswer !== false;
        folderId = await trainingFolderId(user, body.folderId);
        if (body.uploadId) {
          upload = await presentationUpload(user, body.uploadId);
          if (upload.courseId)
            return json({
              course: await courseForOwner(upload.courseId, user),
            });
          const file = await uploadedPresentationFile(upload);
          name = text(body.name, 120) || file.name.replace(/\.[^.]+$/u, "");
          originalName = file.name;
          pages = await processDocument(id, file);
        } else {
          name = text(body.name, 120) || "Dijital Pazarlama Temelleri";
          originalName = "Örnek sunum";
          pages = await demoPages(id);
        }
      }
      try {
        folderId = await trainingFolderId(user, folderId);
      } catch (error) {
        await discardPresentationAssets(id);
        throw error;
      }
      const course = await transaction(async () => {
        const created = await createCourse(
          user.id,
          name,
          originalName,
          pages,
          days,
          auto,
          id,
          folderId,
        );
        if (upload) await completePresentationUpload(upload, created.id);
        return created;
      });
      if (upload) await cleanupPresentationUpload(upload);
      try {
        await queuePresentationIndex(course);
      } catch {
        console.info("[linba.index]", course.id, "queue_retry_pending");
      }
      if (usesSupabase()) after(() => indexPresentation(course.id));
      return json({ course });
    }
    const id = parts[1],
      course = await get<Course>("course", id);
    if (!course) throw new AppError("Training not found.", 404);
    const owner = await canManagePresentation(user, course);
    if (
      ["group", "trash", "restore"].includes(parts[2]) &&
      parts.length === 3 &&
      method === "POST"
    ) {
      const body = parts[2] === "group" ? await request.json() : {};
      await updateTrainingLibrary(
        user,
        id,
        parts[2] as "group" | "trash" | "restore",
        body.groupId,
      );
      return json({ ok: true });
    }
    if (course.trashedAt)
      throw new AppError("Restore this training from Trash first.", 410);
    if (parts[2] === "page" && method === "GET") {
      if (
        !owner &&
        !(await canReadReport(user, course)) &&
        !(
          (await memberOf(id, user.id)) &&
          (canChat(course) || course.status === "draft")
        ) &&
        url.searchParams.get("key") !== course.displayKey
      )
        throw new AppError("You don’t have access to this presentation.", 403);
      const page = course.pages.find((p) => p.number === Number(parts[3]));
      if (!page) throw new AppError("Slide not found.", 404);
      return new Response(
        new Uint8Array(
          await readPresentationAsset(id, page.image, course.showcase),
        ),
        {
          headers: {
            "Content-Type": page.image.endsWith(".svg")
              ? "image/svg+xml"
              : "image/png",
            "Cache-Control": "private, max-age=3600",
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy":
              "default-src 'none'; style-src 'unsafe-inline'",
          },
        },
      );
    }
    if (!owner && !(await memberOf(id, user.id)))
      throw new AppError("Join using the training code first.", 403);
    if (!owner && course.status === "ended" && !canChat(course))
      throw new AppError("Access to this training has expired.", 410);
    if (parts.length === 2 && method === "GET") {
      const [index, state] = await Promise.all([
        presentationIndexState(id),
        stateFor(course, user),
      ]);
      if (
        usesSupabase() &&
        (!index || ["queued", "processing", "error"].includes(index.status))
      )
        after(() => indexPresentation(id));
      return json({
        ...state,
        indexing: index
          ? { status: index.status, chunkCount: index.chunk_count }
          : undefined,
      });
    }
    if (parts[2] === "questions" && method === "POST") {
      if (user.role !== "participant" || !canChat(course))
        throw new AppError("Chat is not open right now.", 403);
      const body = await request.json(),
        question = text(body.text, 2000);
      if (!question) throw new AppError("Enter your question.");
      const prior = await questionsOf(id, true);
      if (prior.some((q) => q.userId === user.id && q.status === "pending"))
        throw new AppError(
          "Wait for the answer to your previous question.",
          429,
        );
      const q: Question = {
        id: randomUUID(),
        courseId: id,
        userId: user.id,
        userName: user.name,
        text: question,
        status: "pending",
        conversationOnly: true,
        groupId: randomUUID(),
        groupTitle: question.slice(0, 70),
        sources: [],
        createdAt: new Date().toISOString(),
        stage: course.status === "live" ? "live" : "followup",
      };
      await put("question", q);
      const conversation = await learningConversationReply(
        course,
        question,
        prior,
        user.id,
      );
      if (conversation) {
        Object.assign(q, conversation, {
          status: "answered",
          groupId: "",
          groupTitle: "",
        });
        await put("question", q);
        return json({ question: participantQuestion(q) });
      }
      delete q.conversationOnly;
      q.status =
        course.status === "live" && !course.autoAnswer ? "manual" : "pending";
      await put("question", q);
      // The answer model receives only this participant's history. Other questions
      // are used solely by the independent, teacher-only grouping task.
      const [answerResult, groupResult] = await Promise.allSettled([
        q.status === "pending"
          ? answerQuestion(course, question, prior, user.id)
          : Promise.resolve(undefined),
        aiReady()
          ? groupQuestion(
              question,
              prior.filter((item) => !item.conversationOnly),
            )
          : Promise.resolve(undefined),
      ]);
      if (q.status === "pending") {
        if (answerResult.status === "fulfilled" && answerResult.value) {
          const answer = answerResult.value;
          Object.assign(q, answer, {
            status: answer.answer ? "answered" : "escalated",
          });
        } else {
          q.status = "escalated";
          q.reason =
            "An AI answer is unavailable. Your question was forwarded to the instructor.";
        }
      }
      if (groupResult.status === "fulfilled" && groupResult.value)
        Object.assign(q, {
          groupId: groupResult.value.groupId || q.groupId,
          groupTitle: groupResult.value.groupTitle,
        });
      await put("question", q);
      if (course.status === "ended") {
        const generation = await prepareReportGeneration(id);
        if (generation) after(() => runReportGeneration(id, generation));
      }
      return json({ question: participantQuestion(q) });
    }
    if (parts[2] === "responses" && method === "POST") {
      if (user.role !== "participant" || course.status !== "live")
        throw new AppError(
          "Activity responses are accepted during live training.",
          403,
        );
      const body = await request.json(),
        slide = activeSlide(course);
      if (slide.kind !== "activity" || slide.id !== body.slideId)
        throw new AppError("This activity is not open right now.");
      const value = text(body.value, 3000);
      if (
        !value ||
        (isChoiceActivity(slide.activity!.type) &&
          !slide.activity!.options.includes(value))
      )
        throw new AppError("Select or write a valid response.");
      return json({
        response: await put("response", {
          id: `${slide.id}:${user.id}`,
          courseId: id,
          slideId: slide.id,
          userId: user.id,
          userName: user.name,
          value,
          createdAt: new Date().toISOString(),
        }),
      });
    }
    await courseForOwner(id, user);
    if (parts[2] === "index" && parts.length === 3 && method === "POST") {
      await queuePresentationIndex(course, true);
      if (usesSupabase()) after(() => indexPresentation(id));
      return json({ ok: true, status: "queued" });
    }
    if (parts[2] === "workspace" && parts.length === 3) {
      if (method !== "POST")
        throw new AppError("This action is not supported.", 405);
      return json({ course: await openPresentationWorkspace(user, id) });
    }
    if (parts[2] === "repeat" && parts.length === 3) {
      if (method !== "POST")
        throw new AppError("This action is not supported.", 405);
      const body = await request.json();
      return json({ course: await repeatTraining(user, id, body.requestId) });
    }
    if (parts[2] === "rehearsal") {
      if (method === "POST") {
        const body = await request.json(),
          audience = text(body.audience);
        if (audience.length < 10)
          throw new AppError("Describe your audience in a few sentences.");
        try {
          const usage: UsageEntry[] = [];
          const personas = await createPersonas(
            audience,
            course,
            (responseId, tokens, usedModel) =>
              usage.push({
                id: responseId,
                stage: "personas",
                model: usedModel || textModelName("personas"),
                usage: cleanUsage(tokens),
              }),
          );
          const rehearsalId = randomUUID();
          return json({
            rehearsal: await put("rehearsal", {
              id: rehearsalId,
              courseId: id,
              audience,
              personas: assignPortraits(personas, rehearsalId),
              promptVersion: REHEARSAL_PROMPT_VERSION,
              createdAt: new Date().toISOString(),
              remarks: [],
              usage,
            }),
          });
        } catch {
          throw new AppError(
            "Participant agents could not be created. Check the connection and try again.",
            502,
          );
        }
      }
      if (method === "PATCH") {
        const body = await request.json(),
          r = await get<Rehearsal>("rehearsal", body.id);
        if (!r || r.courseId !== id)
          throw new AppError("Practice session not found.", 404);
        if (body.action === "voice") {
          if (r.endedAt)
            throw new AppError(
              "Voice settings cannot be changed after practice ends.",
            );
          if (
            !Number.isInteger(body.personaIndex) ||
            !r.personas[body.personaIndex] ||
            !["female", "male", "neutral"].includes(body.gender)
          )
            throw new AppError("Choose a participant voice.");
          const chosen = VOICES.find(
            (v) => v.id === body.voice && v.style === body.gender,
          );
          if (!chosen)
            throw new AppError(
              "Choose a voice matching the participant’s voice style.",
            );
          r.personas = assignVoices(assignPortraits(r.personas, r.id));
          r.personas[body.personaIndex] = {
            ...r.personas[body.personaIndex],
            gender: voiceStyle(body.gender),
            voice: chosen.id,
          };
          return json({ rehearsal: await put("rehearsal", r) });
        }
        if (body.durationSeconds !== undefined) {
          if (
            !Number.isSafeInteger(body.durationSeconds) ||
            body.durationSeconds < 0
          )
            throw new AppError(
              "Practice duration must be a non-negative number of seconds.",
            );
          r.durationSeconds = Math.min(
            body.durationSeconds,
            PRACTICE_LIMIT_SECONDS,
          );
        }
        r.personas = assignPortraits(r.personas, r.id);
        r.endedAt = new Date().toISOString();
        r.remarks = Array.isArray(body.remarks)
          ? body.remarks.slice(0, 100).map((v: unknown) => text(v))
          : [];
        if (body.feedback) {
          try {
            r.feedback = practiceFeedbackContract.parse(body.feedback);
          } catch {
            throw new AppError("The practice feedback could not be verified.");
          }
        }
        return json({ rehearsal: await put("rehearsal", r) });
      }
    }
    if (parts[2] === "rehearsal-usage" && method === "POST") {
      const body = await request.json(),
        r = await get<Rehearsal>("rehearsal", body.rehearsalId);
      if (!r || r.courseId !== id)
        throw new AppError("Practice session not found.", 404);
      if (
        typeof body.responseId !== "string" ||
        !body.responseId.startsWith("resp_") ||
        body.responseId.length > 150 ||
        !body.usage ||
        typeof body.usage !== "object"
      )
        throw new AppError("The usage record is invalid.");
      const saved = await recordRehearsalUsage(r.id, {
        id: body.responseId,
        stage: "conversation",
        model: modelName(),
        usage: cleanUsage(body.usage),
      });
      return json({ usage: saved?.usage || [] });
    }
    if (parts[2] === "rehearsal-speech" && method === "POST") {
      const body = await request.json(),
        r = await get<Rehearsal>("rehearsal", body.rehearsalId);
      if (!r || r.courseId !== id || r.endedAt)
        throw new AppError("No active practice session was found.", 404);
      if (practiceBudgetReached(0, r.voiceExpiresAt))
        throw new AppError(
          "This practice has ended. Start a new practice.",
          410,
        );
      if (
        !Number.isInteger(body.personaIndex) ||
        !r.personas[body.personaIndex]
      )
        throw new AppError("Participant not found.");
      const persona = r.personas[body.personaIndex],
        voice = personaVoice(persona);
      const line = body.preview
        ? `Merhaba, ben ${persona.name}. Eğitimde sizi dinliyor olacağım.`
        : text(body.text, 900);
      if (!line) throw new AppError("The spoken line is empty.");
      if (!body.preview && !practiceTurnIsConcise(line))
        throw new AppError("PARTICIPANT_TURN_TOO_LONG", 422);
      let entry: UsageEntry | undefined;
      if (!body.preview) {
        const valid = await participantLineValid(
          persona,
          line,
          async (responseId, usage, usedModel) =>
            await recordRehearsalUsage(r.id, {
              id: responseId,
              stage: "conversation",
              model: usedModel || textModelName("participant-check"),
              usage: cleanUsage(usage),
            }),
        );
        if (!valid) throw new AppError("PARTICIPANT_ROLE_LEAK", 422);
        const current = await get<Rehearsal>("rehearsal", r.id);
        if (
          !current ||
          current.endedAt ||
          practiceBudgetReached(0, current.voiceExpiresAt)
        )
          throw new AppError(
            "This practice has ended. Start a new practice.",
            410,
          );
      }
      try {
        const wav = await personaSpeech(
          line,
          voice,
          async (responseId, usage, usedModel) => {
            entry = {
              id: responseId,
              stage: body.preview ? "preview" : "speech",
              model: usedModel || speechModelName(),
              usage: cleanUsage(usage),
            };
            await recordRehearsalUsage(r.id, entry);
          },
        );
        return new Response(new Uint8Array(wav), {
          headers: {
            "Content-Type": "audio/wav",
            "Cache-Control": "no-store",
            "X-Linba-Usage": entry ? JSON.stringify(entry) : "",
            "X-Linba-Voice": voice,
          },
        });
      } catch {
        throw new AppError(
          "The participant voice could not be generated. Read the line on screen or try listening again.",
          502,
        );
      }
    }
    if (parts[2] === "voice" && method === "POST") {
      const body = await request.json(),
        r = await get<Rehearsal>("rehearsal", body.rehearsalId);
      if (
        !r ||
        r.courseId !== id ||
        r.endedAt ||
        !aiReady() ||
        typeof body.sdp !== "string" ||
        body.sdp.length > 100000
      )
        throw new AppError("The practice connection could not be created.");
      if (practiceBudgetReached(0, r.voiceExpiresAt))
        throw new AppError(
          "This practice has ended. Start a new practice.",
          410,
        );
      const form = new FormData();
      form.set("sdp", body.sdp);
      form.set(
        "session",
        JSON.stringify({
          type: "realtime",
          model: modelName(),
          output_modalities: ["text"],
          ...participantTools(r.personas.length),
          instructions: buildRehearsalInstructions(r.audience, r.personas),
          audio: {
            input: {
              turn_detection: practiceTurnDetection(),
            },
          },
        }),
      );
      try {
        const response = await fetch(
          "https://api.openai.com/v1/realtime/calls",
          {
            method: "POST",
            headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
            body: form,
            signal: AbortSignal.timeout(30000),
          },
        );
        if (!response.ok) throw new Error("VOICE_FAILED");
        const latest = (await get<Rehearsal>("rehearsal", r.id))!;
        latest.voiceExpiresAt ||= new Date(
          Date.now() + PRACTICE_LIMIT_SECONDS * 1000,
        ).toISOString();
        await put("rehearsal", latest);
        return new Response(await response.text(), {
          headers: {
            "Content-Type": "application/sdp",
            "X-Linba-Practice-Expires-At": latest.voiceExpiresAt,
            "Cache-Control": "no-store",
          },
        });
      } catch {
        throw new AppError(
          "The voice connection failed. Please try again.",
          502,
        );
      }
    }
    if (parts[2] === "generate-activity" && method === "POST") {
      const body = await request.json(),
        page = activitySourcePage(course, body.pageId);
      if (!page) throw new AppError("Slide not found.", 404);
      if (!["poll", "true-false", "open"].includes(body.type))
        throw new AppError("Choose an available activity type.");
      try {
        const generated = await generateActivity(course, page, body.type);
        return json({
          activity: activity({
            ...generated,
            type: body.type,
            ...(body.type === "true-false"
              ? { options: ["Doğru", "Yanlış"] }
              : {}),
            aiGenerated: true,
          }),
        });
      } catch {
        throw new AppError(
          "The activity could not be generated. Write your own question or try again.",
          502,
        );
      }
    }
    if (parts.length === 2 && method === "PATCH") {
      const body = await request.json();
      const course = await courseForOwner(id, user);
      if (course.trashedAt)
        throw new AppError("Restore this training from Trash first.", 410);
      if (body.action === "rename") {
        if (
          typeof body.name !== "string" ||
          !body.name.trim() ||
          body.name.trim().length > 120
        )
          throw new AppError(
            "Enter a training name between 1 and 120 characters.",
          );
        course.name = body.name.trim();
      } else if (body.action === "notes") {
        const slide = course.slides.find((slide) => slide.id === body.slideId);
        if (!slide) throw new AppError("Slide not found.", 404);
        if (typeof body.notes !== "string" || body.notes.length > 10000)
          throw new AppError("Notes must be no longer than 10,000 characters.");
        slide.notes = body.notes;
      } else if (body.action === "select") {
        if (!course.slides.some((s) => s.id === body.slideId))
          throw new AppError("Slide not found.");
        course.activeSlideId = body.slideId;
        course.slideVersion++;
      } else if (body.action === "settings") {
        course.name = text(body.name, 120) || course.name;
        course.accessDays = accessDays(body.accessDays);
        course.autoAnswer = !!body.autoAnswer;
      } else if (body.action === "start") {
        if (course.status !== "draft")
          throw new AppError("This training has already started.");
        course.activeSlideId = course.slides[0].id;
        course.status = "live";
        course.startedAt = new Date().toISOString();
        delete course.pausedAt;
        course.pausedDurationMs = 0;
        course.slideVersion++;
        if (isShowcase(course)) await seedShowcaseRecords(course);
      } else if (body.action === "pause" || body.action === "resume") {
        if (course.status !== "live")
          throw new AppError("This training is not live.");
        setPresentationPaused(course, body.action === "pause");
      } else if (body.action === "refresh-showcase") {
        if (!isShowcase(course) || course.status !== "live")
          throw new AppError(
            "This action is only available for the example live presentations.",
            400,
          );
        course.startedAt = new Date().toISOString();
        delete course.pausedAt;
        course.pausedDurationMs = 0;
        await seedShowcaseRecords(course);
      } else if (body.action === "end") {
        if (course.status !== "live")
          throw new AppError("This training is not live.");
        const endedAt = Date.now();
        setPresentationPaused(course, false, endedAt);
        course.status = "ended";
        course.endedAt = new Date(endedAt).toISOString();
        await put("course", course);
        const generation = await prepareReportGeneration(id);
        if (generation) after(() => runReportGeneration(id, generation));
        return json(await stateFor((await get<Course>("course", id))!, user));
      } else if (body.action === "reorder") {
        if (course.status !== "draft")
          throw new AppError("Reorder slides before training starts.");
        validateSlideOrder(course, body.ids);
        course.slides = body.ids.map((slideId: string) =>
          course.slides.find((s) => s.id === slideId)!,
        );
      } else if (body.action === "add-activity") {
        if (course.status !== "draft")
          throw new AppError("Add activities before training starts.");
        if (body.activity?.type === "scenario")
          throw new AppError("Choose an available activity type.");
        const s = {
          id: randomUUID(),
          kind: "activity" as const,
          activity: activity(body.activity),
        };
        const index = course.slides.findIndex((s) => s.id === body.afterId);
        course.slides.splice(index + 1, 0, s);
        course.activeSlideId = s.id;
      } else if (body.action === "update-activity") {
        if (course.status !== "draft")
          throw new AppError("Edit activities before training starts.");
        const s = course.slides.find(
          (s) => s.id === body.slideId && s.kind === "activity",
        );
        if (!s) throw new AppError("Activity not found.");
        s.activity = activity(body.activity);
      } else if (body.action === "remove-activity") {
        if (course.status !== "draft")
          throw new AppError("Remove activities before training starts.");
        course.slides = course.slides.filter(
          (s) => !(s.id === body.slideId && s.kind === "activity"),
        );
        if (!course.slides.some((s) => s.id === course.activeSlideId))
          course.activeSlideId = course.slides[0].id;
      } else if (body.action === "addressed") {
        const q = await get<Question>("question", body.questionId);
        if (!q || q.courseId !== id) throw new AppError("Question not found.");
        await put("question", { ...q, addressed: !!body.value });
        return json(await stateFor(course, user));
      } else throw new AppError("Action not found.");
      await put("course", course);
      if (body.action === "select" && body.compact === true)
        return json({
          activeSlideId: course.activeSlideId,
          slideVersion: course.slideVersion,
        });
      return json(await stateFor(course, user));
    }
    throw new AppError("Action not found.", 404);
  } catch (error) {
    return apiError(error);
  }
}
const endpoint = (request: Request, context: Context) =>
  withDatabaseReadCache(() => handle(request, context));
export {
  endpoint as GET,
  endpoint as POST,
  endpoint as PATCH,
  endpoint as DELETE,
};

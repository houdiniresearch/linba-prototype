/** The same small JSON Schema subset is sent to the provider and checked locally. */
export type JsonSchema = {
  type:
    | "object"
    | "array"
    | "string"
    | "integer"
    | "number"
    | "boolean"
    | "null"
    | ("string" | "null")[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: false;
  items?: JsonSchema;
  enum?: (string | number | null)[];
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
};
export type OutputContract<T> = {
  name: string;
  schema: JsonSchema;
  parse: (value: unknown) => T;
};
export const objectSchema = (
  properties: Record<string, JsonSchema>,
): JsonSchema => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});
const str = (maxLength: number, minLength = 1): JsonSchema => ({
  type: "string",
  minLength,
  maxLength,
});
const strings = (maxItems: number, length = 600): JsonSchema => ({
  type: "array",
  items: str(length),
  maxItems,
});

export function matchesSchema(value: unknown, schema: JsonSchema): boolean {
  if (schema.enum && !schema.enum.includes(value as string | number | null))
    return false;
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  if (value === null) return types.includes("null");
  if (typeof value === "string")
    return (
      types.includes("string") &&
      value.trim().length >= (schema.minLength || 0) &&
      value.length <= (schema.maxLength ?? Infinity)
    );
  if (typeof value === "number")
    return (
      Number.isFinite(value) &&
      (types.includes("number") ||
        (types.includes("integer") && Number.isSafeInteger(value)))
    );
  if (typeof value === "boolean") return types.includes("boolean");
  if (Array.isArray(value))
    return (
      types.includes("array") &&
      value.length >= (schema.minItems || 0) &&
      value.length <= (schema.maxItems ?? Infinity) &&
      !!schema.items &&
      value.every((item) => matchesSchema(item, schema.items!))
    );
  if (typeof value !== "object" || !types.includes("object")) return false;
  const record = value as Record<string, unknown>;
  return (
    (schema.required || []).every((key) => Object.hasOwn(record, key)) &&
    Object.entries(record).every(
      ([key, item]) =>
        !!schema.properties?.[key] &&
        matchesSchema(item, schema.properties[key]),
    )
  );
}
export function contract<T>(
  name: string,
  schema: JsonSchema,
  refine?: (value: T) => boolean,
): OutputContract<T> {
  return {
    name,
    schema,
    parse(value) {
      if (!matchesSchema(value, schema) || (refine && !refine(value as T)))
        throw new Error("AI_INVALID_OUTPUT");
      return value as T;
    },
  };
}

export type GroundedAnswer = {
  answer: string | null;
  sourcePages: number[];
  evidence: { page: number; quote: string }[];
  reason: string;
};
export const answerContract = contract<GroundedAnswer>(
  "grounded_answer_v3",
  objectSchema({
    answer: { type: ["string", "null"], maxLength: 4000, minLength: 1 },
    sourcePages: { type: "array", items: { type: "integer" }, maxItems: 5 },
    evidence: {
      type: "array",
      items: objectSchema({ page: { type: "integer" }, quote: str(600) }),
      maxItems: 5,
    },
    reason: str(400, 0),
  }),
  (value) =>
    value.answer === null
      ? value.sourcePages.length === 0 && value.evidence.length === 0
      : value.sourcePages.length > 0 && value.evidence.length > 0,
);
export const groupContract = contract<{
  groupId: string | null;
  groupTitle: string;
}>(
  "question_group_v2",
  objectSchema({
    groupId: { type: ["string", "null"], maxLength: 100 },
    groupTitle: str(100),
  }),
);
export type ReportOutput = { summary: string; recommendations: string[] };
export const reportContract = contract<ReportOutput>(
  "presentation_report_v3",
  objectSchema({ summary: str(3000), recommendations: strings(3) }),
);
export const reportChatContract = contract<{
  answer: string;
  sourceIds: string[];
}>(
  "report_chat_v3",
  objectSchema({
    answer: str(8000),
    sourceIds: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: { type: "string", enum: ["counts", "questions", "activities"] },
    },
  }),
);
export type PracticeFeedbackOutput = {
  summary: string;
  suggestions: string[];
  questions: string[];
};
export const practiceFeedbackContract = contract<PracticeFeedbackOutput>(
  "practice_feedback_v3",
  objectSchema({
    summary: str(4000),
    suggestions: strings(4),
    questions: strings(10, 500),
  }),
);

export type PersonaOutput = {
  name: string;
  gender: "female" | "male" | "neutral";
  background: string;
  behavior: string;
  priorKnowledge: string;
  learningGoal: string;
  misconception: string;
  speakingStyle: string;
};
export const personasContract = contract<{ personas: PersonaOutput[] }>(
  "practice_personas_v3",
  objectSchema({
    personas: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: objectSchema({
        name: str(40),
        gender: { type: "string", enum: ["female", "male", "neutral"] },
        background: str(500),
        behavior: str(500),
        priorKnowledge: str(180),
        learningGoal: str(180),
        misconception: str(180),
        speakingStyle: str(180),
      }),
    },
  }),
  (value) =>
    new Set(value.personas.map((p) => p.name.trim().toLocaleLowerCase("tr-TR")))
      .size === 3,
);

export type ActivityOutput = {
  type: "poll" | "true-false" | "open";
  question: string;
  options: string[];
};
export function activityContract(type: ActivityOutput["type"]) {
  return contract<ActivityOutput>(
    `activity_${type.replace("-", "_")}_v3`,
    objectSchema({
      type: { type: "string", enum: [type] },
      question: str(1200),
      options: strings(
        type === "open" ? 0 : type === "true-false" ? 2 : 4,
        200,
      ),
    }),
    (value) =>
      type === "open"
        ? value.options.length === 0
        : type === "true-false"
          ? value.options.join("|") === "Doğru|Yanlış"
          : value.options.length >= 3 &&
            new Set(
              value.options.map((x) => x.trim().toLocaleLowerCase("tr-TR")),
            ).size === value.options.length,
  );
}

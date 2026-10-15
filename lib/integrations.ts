export const integrations = [
  { id: "powerpoint", name: "PowerPoint" },
  { id: "teams", name: "Microsoft Teams" },
  { id: "google-slides", name: "Google Slides" },
  { id: "zoom", name: "Zoom" },
  { id: "chatgpt", name: "ChatGPT" },
] as const;

export type IntegrationId = (typeof integrations)[number]["id"];

export function isIntegrationId(value: unknown): value is IntegrationId {
  return integrations.some((item) => item.id === value);
}

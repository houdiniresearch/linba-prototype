export const integrations = [
  { id: "powerpoint", name: "PowerPoint" },
  { id: "teams", name: "Microsoft Teams" },
  { id: "google-slides", name: "Google Slides" },
  { id: "zoom", name: "Zoom" },
  { id: "google-meet", name: "Google Meet" },
  { id: "chatgpt", name: "ChatGPT" },
  { id: "claude", name: "Claude" },
] as const;

export type IntegrationId = (typeof integrations)[number]["id"];

export function isIntegrationId(value: unknown): value is IntegrationId {
  return integrations.some((item) => item.id === value);
}

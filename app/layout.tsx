import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LocaleProvider } from "@/components/locale-provider";
import { ThemeProvider } from "@/components/theme-provider";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./globals.css";
import "./product.css";
import "@/components/agent-identity.css";
import "@/components/practice-workspace.css";
import "@/components/activity-editor.css";
import "@/components/editor-workspace.css";
import "@/components/ai-orbit-button.css";
import "@/components/slide-rail.css";
import "@/components/report-preview.css";
import "@/components/participant-source.css";
import "@/components/participant-entry.css";
import "@/components/live-experience.css";
import "@/components/home-updates.css";
import "@/components/workspace-chrome.css";
import "@/components/workspace-library.css";
import "@/components/session-experience.css";
import "@/components/workspace-pattern.css";
import "@/components/team-workspace.css";
import "@/components/product-select.css";
import "@/components/report-detail.css";
import "@/components/presentation-agents.css";
import "@/components/live-control-center.css";

export const metadata: Metadata = {
  title: "LİNBA — Presentation workspace",
  description:
    "AI agents for practice, participant engagement and learning insights.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("linba_locale")?.value === "en" ? "en" : "tr";
  const savedTheme = cookieStore.get("linba_theme")?.value;
  const theme =
    savedTheme === "light" || savedTheme === "dark" ? savedTheme : "system";
  return (
    <html lang={locale} data-theme={theme} data-scroll-behavior="smooth">
      <body>
        <LocaleProvider initialLocale={locale}>
          <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}

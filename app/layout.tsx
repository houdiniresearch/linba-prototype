import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LocaleProvider } from "@/components/locale-provider";
import { ThemeProvider } from "@/components/theme-provider";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "LİNBA — Eğitim çalışma alanı",
  description: "Sunumunu yükle, eğitimini prova et ve birlikte öğren.",
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

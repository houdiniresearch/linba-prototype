import type { NextConfig } from "next";
import { localAddresses } from "./lib/network";

const nextConfig: NextConfig = {
  output: process.env.LINBA_CONTAINER === "true" ? "standalone" : undefined,
  serverExternalPackages: ["pdfjs-dist", "@napi-rs/canvas"],
  outputFileTracingIncludes: {
    "/api/*": [
      "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
      "node_modules/pdfjs-dist/cmaps/**/*",
      "node_modules/pdfjs-dist/standard_fonts/**/*",
      "node_modules/@napi-rs/canvas*/**/*",
    ],
  },
  devIndicators: false,
  redirects: async () => [
    { source: "/giris", destination: "/login", permanent: true },
    { source: "/kesfet", destination: "/explore", permanent: true },
    { source: "/katil", destination: "/join", permanent: true },
    {
      source: "/rapor-asistani",
      destination: "/report-agent",
      permanent: true,
    },
    { source: "/sunum/:id", destination: "/present/:id", permanent: true },
    {
      source: "/egitim/:id/prova",
      destination: "/training/:id/practice",
      permanent: true,
    },
    {
      source: "/egitim/:id/onizleme",
      destination: "/training/:id/preview",
      permanent: true,
    },
    {
      source: "/egitim/:id/canli",
      destination: "/training/:id/live",
      permanent: true,
    },
    { source: "/egitim/:id", destination: "/training/:id", permanent: true },
  ],
  allowedDevOrigins: ["127.0.0.1", ...localAddresses()],
};
export default nextConfig;

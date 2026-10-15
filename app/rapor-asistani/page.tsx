import { ReportAssistant } from "@/components/report-assistant";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Rapor asistanı — LİNBA" };

export default function Page() {
  return (
    <Suspense>
      <ReportAssistant />
    </Suspense>
  );
}

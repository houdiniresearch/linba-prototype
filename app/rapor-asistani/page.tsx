import { ReportAssistant } from "@/components/report-assistant";
import { Suspense } from "react";
import type { Metadata } from "next";
import { ReportWorkspaceSkeleton } from "@/components/skeletons";

export const metadata: Metadata = { title: "Rapor asistanı — LİNBA" };

export default function Page() {
  return (
    <Suspense fallback={<ReportWorkspaceSkeleton />}>
      <ReportAssistant />
    </Suspense>
  );
}

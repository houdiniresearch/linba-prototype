import { ReportAssistant } from "@/components/report-assistant";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { ReportWorkspaceSkeleton } from "@/components/skeletons";

export const metadata: Metadata = { title: "Report agent — LİNBA" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ report?: string; rapor?: string }>;
}) {
  const { report, rapor } = await searchParams;
  if (rapor)
    redirect(`/report-agent?report=${encodeURIComponent(report || rapor)}`);
  return (
    <Suspense fallback={<ReportWorkspaceSkeleton />}>
      <ReportAssistant />
    </Suspense>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { AuthEntry } from "@/components/auth-entry";

export const metadata: Metadata = { title: "Experience LİNBA agents | LİNBA" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; mod?: string }>;
}) {
  const { mode, mod } = await searchParams;
  if (mod) redirect(`/login${mod === "giris" ? "?mode=signin" : ""}`);
  if (await currentUser()) redirect("/");
  return <AuthEntry login={mode === "signin"} />;
}

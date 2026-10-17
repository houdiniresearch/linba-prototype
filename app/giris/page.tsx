import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { AuthEntry } from "@/components/auth-entry";

export const metadata: Metadata = {
  title: "LİNBA ajanlarını deneyimle | LİNBA",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ mod?: string }>;
}) {
  if (await currentUser()) redirect("/");
  const { mod } = await searchParams;
  return <AuthEntry login={mod === "giris"} />;
}

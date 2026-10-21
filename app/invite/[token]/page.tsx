import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { TeamInvitation } from "@/components/team-invitation";

export const metadata: Metadata = {
  title: "Join your team | LİNBA",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <TeamInvitation token={token} initialUser={await currentUser()} />;
}

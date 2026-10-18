import { Dashboard } from "@/components/dashboard";
import { Landing } from "@/components/landing";
import { currentUser } from "@/lib/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LİNBA | AI agents for training",
  description:
    "Practice with AI agents, engage participants and explore learning outcomes.",
};

export default async function Page() {
  return (await currentUser()) ? <Dashboard /> : <Landing />;
}

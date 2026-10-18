import type { Metadata } from "next";
import { Landing } from "@/components/landing";

export const metadata: Metadata = {
  title: "LİNBA | AI agents for training",
  description:
    "Practice with AI agents, engage participants and evaluate learning outcomes.",
  alternates: { canonical: "/" },
};

export default function Page() {
  return <Landing />;
}

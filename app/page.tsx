import { Dashboard } from "@/components/dashboard";
import { Landing } from "@/components/landing";
import { currentUser } from "@/lib/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LİNBA | Eğitim için yapay zekâ ajanları",
  description:
    "Yapay zekâ ajanlarıyla sesli pratik yap, katılımcılarla etkileşim kur ve öğrenme sonuçlarını değerlendir.",
};

export default async function Page() {
  return (await currentUser()) ? <Dashboard /> : <Landing />;
}

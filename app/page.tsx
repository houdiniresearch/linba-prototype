import { Dashboard } from "@/components/dashboard";
import { Landing } from "@/components/landing";
import { currentUser } from "@/lib/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LİNBA | Sunumdan birlikte öğrenmeye",
  description:
    "Sunumunu yükle, kitlenle sesli prova yap, eğitimini etkileşimli hale getir. Eğitimden sonra da dokümanına dayanan asistanla öğrenmeyi sürdür.",
};

export default async function Page() {
  return (await currentUser()) ? <Dashboard /> : <Landing />;
}

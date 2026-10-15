import type { Metadata } from "next";
import { Landing } from "@/components/landing";

export const metadata: Metadata = {
  title: "LİNBA | Sunumdan birlikte öğrenmeye",
  description:
    "Sunumunu yükle, kitlenle sesli prova yap, eğitimini etkileşimli hale getir. Eğitimden sonra da dokümanına dayanan asistanla öğrenmeyi sürdür.",
  alternates: { canonical: "/" },
};

export default function Page() {
  return <Landing />;
}

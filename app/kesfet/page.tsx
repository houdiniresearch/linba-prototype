import type { Metadata } from "next";
import { Landing } from "@/components/landing";

export const metadata: Metadata = {
  title: "LİNBA | Eğitim için yapay zekâ ajanları",
  description:
    "Yapay zekâ ajanlarıyla sesli pratik yap, katılımcılarla etkileşim kur ve öğrenme sonuçlarını değerlendir.",
  alternates: { canonical: "/" },
};

export default function Page() {
  return <Landing />;
}

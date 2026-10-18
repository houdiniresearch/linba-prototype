import { Participant } from "@/components/participant";
import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    training?: string;
    code?: string;
    egitim?: string;
    kod?: string;
  }>;
}) {
  const query = await searchParams;
  if (query.egitim || query.kod) {
    const canonical = new URLSearchParams();
    if (query.training || query.egitim)
      canonical.set("training", query.training || query.egitim!);
    if (query.code || query.kod)
      canonical.set("code", query.code || query.kod!);
    redirect(`/join?${canonical}`);
  }
  return <Participant />;
}

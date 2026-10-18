import { RehearsalView } from "@/components/rehearsal";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RehearsalView id={id} />;
}

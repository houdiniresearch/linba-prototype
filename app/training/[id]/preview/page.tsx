import { Preview } from "@/components/presentation";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Preview id={id} />;
}

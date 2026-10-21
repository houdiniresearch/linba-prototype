"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useProductLocale } from "./product-locale";
export function useWorkspaceNavigation() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return {
    pending,
    navigate: (path: string) => start(() => router.push(path)),
  };
}
export function RouteProgress({ pending }: { pending: boolean }) {
  const { t } = useProductLocale();
  return pending ? (
    <div className="route-progress" role="status">
      <span className="sr-only">{t("Loading…")}</span>
    </div>
  ) : null;
}

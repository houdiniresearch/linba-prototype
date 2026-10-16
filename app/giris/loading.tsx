import { Skeleton } from "@/components/skeletons";
import { Logo } from "@/components/ui";
import "@/components/access-entry.css";

export default function Loading() {
  return (
    <div className="access-page" aria-busy="true" aria-label="LİNBA yükleniyor">
      <header className="access-header">
        <Logo />
      </header>
      <main className="access-layout" aria-hidden="true">
        <div className="access-loading-block">
          <Skeleton className="sk-line" />
          <Skeleton className="sk-auth-display" />
        </div>
        <div className="access-invitation">
          <Skeleton className="sk-auth-display" />
          <Skeleton className="sk-auth-input" />
        </div>
      </main>
    </div>
  );
}

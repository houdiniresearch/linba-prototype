import Image from "next/image";

export type EmptyArtworkKind = "training" | "reports" | "conversation";

/** Decorative artwork; the surrounding heading explains the actual state. */
export function EmptyArtwork({
  kind,
  compact = false,
}: {
  kind: EmptyArtworkKind;
  compact?: boolean;
}) {
  return (
    <Image
      src={`/empty-states/${kind}-hq.webp`}
      alt=""
      width={224}
      height={150}
      unoptimized
      className={`empty-artwork${compact ? " is-compact" : ""}`}
    />
  );
}

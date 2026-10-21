"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";
import * as Dialog from "@radix-ui/react-dialog";

/** Desktop navigation becomes a modal drawer on narrow screens. */
export function ResponsiveSidebar({
  open,
  onOpenChange,
  returnFocusRef,
  label,
  className,
  overlayClassName,
  id,
  restoreFocus = true,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocusRef: RefObject<HTMLElement | null>;
  label: string;
  className: string;
  overlayClassName: string;
  id?: string;
  restoreFocus?: boolean;
  children: ReactNode;
}) {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px)");
    const update = () => {
      setCompact(query.matches);
      if (!query.matches) onOpenChange(false);
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [onOpenChange]);
  if (!compact)
    return (
      <aside id={id} className={className} aria-label={label}>
        {children}
      </aside>
    );
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Overlay className={overlayClassName} />
      <Dialog.Content
        asChild
        aria-modal="true"
        aria-describedby={undefined}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const target = returnFocusRef.current;
          if (
            restoreFocus &&
            target?.isConnected &&
            target.getClientRects().length
          )
            target.focus({ preventScroll: true });
        }}
      >
        <aside id={id} className={className}>
          <Dialog.Title className="sr-only">{label}</Dialog.Title>
          {children}
        </aside>
      </Dialog.Content>
    </Dialog.Root>
  );
}

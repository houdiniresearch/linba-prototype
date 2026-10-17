"use client";
import { useLocale } from "./locale-provider";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  House,
  Folder,
  ChartBar,
  Gear,
  MagnifyingGlass,
  Plus,
  ArrowLeft,
  ArrowRight,
  CaretLeft,
  CaretRight,
  X,
  UploadSimple,
  Presentation,
  Microphone,
  Play,
  Pause,
  Stop,
  Users,
  Chats,
  Lightning,
  Sparkle,
  Check,
  Clock,
  SignOut,
  DotsThree,
  ArrowUp,
  ArrowDown,
  Trash,
  FilePdf,
  Eye,
  WarningCircle,
  CheckCircle,
  PaperPlaneTilt,
  Link,
  ArrowsOut,
  Monitor,
  List,
  SpinnerGap,
  Bell,
  Globe,
  Star,
  CaretDown,
  Sun,
  Moon,
  ArrowSquareOut,
} from "@phosphor-icons/react";
const icons = {
  home: House,
  folder: Folder,
  chart: ChartBar,
  settings: Gear,
  search: MagnifyingGlass,
  plus: Plus,
  back: ArrowLeft,
  arrow: ArrowRight,
  left: CaretLeft,
  right: CaretRight,
  close: X,
  upload: UploadSimple,
  presentation: Presentation,
  mic: Microphone,
  play: Play,
  pause: Pause,
  stop: Stop,
  users: Users,
  chat: Chats,
  activity: Lightning,
  sparkle: Sparkle,
  check: Check,
  clock: Clock,
  logout: SignOut,
  more: DotsThree,
  up: ArrowUp,
  down: ArrowDown,
  trash: Trash,
  file: FilePdf,
  eye: Eye,
  warning: WarningCircle,
  success: CheckCircle,
  send: PaperPlaneTilt,
  link: Link,
  expand: ArrowsOut,
  monitor: Monitor,
  menu: List,
  spinner: SpinnerGap,
  bell: Bell,
  globe: Globe,
  star: Star,
  downCaret: CaretDown,
  sun: Sun,
  moon: Moon,
  external: ArrowSquareOut,
};
export function Icon({
  name,
  size = 20,
  ...props
}: {
  name: keyof typeof icons;
  size?: number;
  className?: string;
}) {
  const Component = icons[name];
  return (
    <Component size={size} weight="regular" aria-hidden="true" {...props} />
  );
}
export function Logo() {
  return (
    <span className="logo" role="img" aria-label="LİNBA">
      <Image
        className="logo-image"
        src="/brand/linba-logo-color.svg"
        alt=""
        aria-hidden="true"
        width={700}
        height={214}
        unoptimized
      />
      <Image
        className="logo-image logo-image-dark"
        src="/brand/linba-logo-dark.svg"
        alt=""
        aria-hidden="true"
        width={700}
        height={214}
        unoptimized
      />
    </span>
  );
}
export async function api<T = any>(
  url: string,
  body?: unknown,
  method?: string,
): Promise<T> {
  const response = await fetch(`/api/${url}`, {
    method: method || (body ? "POST" : "GET"),
    headers:
      body instanceof FormData
        ? undefined
        : body
          ? { "Content-Type": "application/json" }
          : undefined,
    body:
      body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "İşlem tamamlanamadı.");
  return result;
}
export function useResource<T>(url: string, interval = 0, enabled = true) {
  const [record, setRecord] = useState<{ url: string; value: T }>();
  const [failure, setFailure] = useState<{ url: string; message: string }>();
  const currentUrl = useRef(url);
  currentUrl.current = enabled ? url : "";
  const setData = useCallback(
    (value: T | undefined) => {
      if (currentUrl.current === url)
        setRecord(value === undefined ? undefined : { url, value });
    },
    [url],
  );
  const refresh = useCallback(
    async (clearError = true) => {
      if (!enabled) return;
      if (clearError && currentUrl.current === url) setFailure(undefined);
      try {
        const result = await api<T>(url);
        if (currentUrl.current !== url) return;
        setData(result);
        setFailure(undefined);
        return result;
      } catch (e) {
        if (currentUrl.current === url)
          setFailure({ url, message: (e as Error).message });
      }
    },
    [url, setData, enabled],
  );
  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (stopped) return;
      await refresh(false);
      if (interval && !stopped) timer = setTimeout(tick, interval);
    };
    void tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [refresh, interval, enabled]);
  return {
    data: enabled && record?.url === url ? record.value : undefined,
    setData,
    error: enabled && failure?.url === url ? failure.message : "",
    refresh,
  };
}
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  wide = false,
  closeDisabled = false,
  className = "",
  returnFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  wide?: boolean;
  closeDisabled?: boolean;
  className?: string;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}) {
  const { t } = useLocale();

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
          className={`modal ${wide ? "wide" : ""} ${className}`}
          aria-describedby={description ? "modal-description" : undefined}
          onCloseAutoFocus={
            returnFocusRef
              ? (event) => {
                  event.preventDefault();
                  returnFocusRef.current?.focus();
                }
              : undefined
          }
        >
          <div className="modal-heading">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close
              className="icon-button"
              aria-label={t("Kapat")}
              disabled={closeDisabled}
            >
              <Icon name="close" />
            </Dialog.Close>
          </div>
          {description && (
            <Dialog.Description id="modal-description" className="muted">
              {description}
            </Dialog.Description>
          )}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function ErrorNote({ message }: { message?: string }) {
  const { t } = useLocale();
  return message ? (
    <div className="error-note" role="alert">
      <Icon name="warning" />
      {t(message)}
    </div>
  ) : null;
}
export function Loading({ label = "Yükleniyor…" }: { label?: string }) {
  const { t } = useLocale();
  return (
    <div className="loading" role="status">
      <Icon name="spinner" className="spin" />
      {t(label)}
    </div>
  );
}
export function ResourceFailure({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => unknown;
}) {
  const { t } = useLocale();
  return (
    <div className="resource-failure">
      <ErrorNote message={error} />
      <button className="button" onClick={() => void onRetry()}>
        {t("Yeniden dene")}
      </button>
    </div>
  );
}
export function Status({ status }: { status: string }) {
  const { t } = useLocale();

  return (
    <span className={`status ${status}`}>
      {status === "live"
        ? t("Canlı")
        : status === "ended"
          ? t("Tamamlandı")
          : t("Hazırlanıyor")}
    </span>
  );
}
export function date(value: string, locale: "tr" | "en" = "tr") {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}
export function Empty({
  icon = "folder",
  title,
  description,
  children,
}: {
  icon?: keyof typeof icons;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  const { t } = useLocale();
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name={icon} size={30} />
      </span>
      <h3>{t(title)}</h3>
      <p>{t(description)}</p>
      {children}
    </div>
  );
}

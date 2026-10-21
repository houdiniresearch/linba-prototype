"use client";
import { clientResources } from "@/lib/client-resource-cache";
import { useProductLocale as useLocale } from "./product-locale";
import { AgentMark } from "./agent-identity";
import { EmptyArtwork, type EmptyArtworkKind } from "./empty-artwork";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  House,
  PencilSimple,
  Question,
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
  CalendarBlank,
  FolderPlus,
  ShieldCheck,
  CreditCard,
  UserCircle,
  SlidersHorizontal,
} from "@phosphor-icons/react";
const icons = {
  home: House,
  edit: PencilSimple,
  calendar: CalendarBlank,
  folderPlus: FolderPlus,
  shield: ShieldCheck,
  creditCard: CreditCard,
  user: UserCircle,
  preferences: SlidersHorizontal,
  help: Question,
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
  agent: AgentMark,
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
  if (name === "agent") return <AgentMark size={size} {...props} />;
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
        loading="eager"
      />
      <Image
        className="logo-image logo-image-dark"
        src="/brand/linba-logo-dark.svg"
        alt=""
        aria-hidden="true"
        width={700}
        height={214}
        unoptimized
        loading="eager"
      />
    </span>
  );
}
export async function api<T = any>(
  url: string,
  body?: unknown,
  method?: string,
): Promise<T> {
  if ((method || (body ? "POST" : "GET")).toUpperCase() !== "GET")
    clientResources.invalidateForMutation(url, body);
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
  if ((method || (body ? "POST" : "GET")).toUpperCase() !== "GET")
    clientResources.invalidateForMutation(url, body);
  if (
    response.ok &&
    (method || (body ? "POST" : "GET")).toUpperCase() !== "GET"
  )
    clientResources.commit(url, result);
  if (!response.ok)
    throw Object.assign(
      new Error(result.error || "The action could not be completed."),
      { status: response.status },
    );
  return result;
}
export function useResource<T>(url: string, interval = 0, enabled = true) {
  const data = useSyncExternalStore(
    clientResources.subscribe,
    () => (enabled ? clientResources.peek<T>(url, true) : undefined),
    () => undefined,
  );
  const [failure, setFailure] = useState<{ url: string; message: string }>();
  const currentUrl = useRef(url);
  currentUrl.current = enabled ? url : "";
  const setData = useCallback(
    (value: T | undefined) => {
      if (currentUrl.current === url) {
        if (value === undefined) clientResources.remove(url);
        else clientResources.set(url, value);
      }
    },
    [url],
  );
  const refresh = useCallback(
    async (clearError = true) => {
      if (!enabled) return;
      if (clearError && currentUrl.current === url) setFailure(undefined);
      const session = clientResources.sessionVersion;
      try {
        const result = await clientResources.read(
          url,
          () => api<T>(url),
          clearError,
        );
        if (
          currentUrl.current !== url ||
          session !== clientResources.sessionVersion
        )
          return;
        setFailure(undefined);
        return result;
      } catch (e) {
        if (
          currentUrl.current === url &&
          session === clientResources.sessionVersion
        ) {
          if ([401, 403, 404, 410].includes((e as { status: number }).status))
            clientResources.remove(url);
          setFailure({ url, message: (e as Error).message });
        }
      }
    },
    [url, enabled],
  );
  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (stopped) return;
      if (document.visibilityState !== "hidden") await refresh(false);
      if (interval && !stopped) timer = setTimeout(tick, interval);
    };
    const recover = () => {
      if (document.visibilityState === "visible") void refresh(url === "auth");
    };
    document.addEventListener("visibilitychange", recover);
    void tick();
    return () => {
      document.removeEventListener("visibilitychange", recover);
      stopped = true;
      clearTimeout(timer);
    };
  }, [refresh, interval, enabled]);
  return {
    data,
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
  const descriptionId = useId();
  const opener = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
          aria-modal="true"
          className={`modal ${wide ? "wide" : ""} ${className}`}
          aria-describedby={description ? descriptionId : undefined}
          onOpenAutoFocus={() => {
            opener.current =
              document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;
          }}
          onEscapeKeyDown={(event) => {
            const selectMenu =
              event.currentTarget instanceof Element
                ? event.currentTarget.querySelector<HTMLElement>(
                    ".product-select-menu:popover-open",
                  )
                : document.querySelector<HTMLElement>(
                    ".product-select-menu:popover-open",
                  );
            if (selectMenu) {
              event.preventDefault();
              selectMenu.hidePopover();
            } else if (closeDisabled) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (closeDisabled) event.preventDefault();
          }}
          onCloseAutoFocus={(event) => {
            const target = [returnFocusRef?.current, opener.current].find(
              (element) => element?.isConnected,
            );
            if (target?.isConnected) {
              event.preventDefault();
              target.focus({ preventScroll: true });
            }
          }}
        >
          <div className="modal-heading">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close
              className="icon-button"
              aria-label={t("Close")}
              disabled={closeDisabled}
            >
              <Icon name="close" />
            </Dialog.Close>
          </div>
          {description && (
            <Dialog.Description id={descriptionId} className="muted">
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
export function Loading({ label = "Loading…" }: { label?: string }) {
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
        {t("Try again")}
      </button>
    </div>
  );
}
export function Status({ status }: { status: string }) {
  const { t } = useLocale();

  return (
    <span className={`status ${status}`}>
      {status === "live"
        ? t("Live")
        : status === "ended"
          ? t("Completed")
          : t("Draft")}
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
export function dateTime(value: string, locale: "tr" | "en" = "tr") {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}
export function Empty({
  icon = "folder",
  title,
  description,
  children,
  illustration,
  compact = false,
}: {
  icon?: keyof typeof icons;
  title: string;
  description: string;
  children?: React.ReactNode;
  illustration?: EmptyArtworkKind | false;
  compact?: boolean;
}) {
  const { t } = useLocale();
  const artwork =
    illustration === false
      ? null
      : illustration ||
        (icon === "chart"
          ? "reports"
          : icon === "chat" || icon === "activity"
            ? "conversation"
            : "training");
  return (
    <div className={`empty${compact ? " is-compact" : ""}`}>
      {artwork ? (
        <EmptyArtwork kind={artwork} compact={compact} />
      ) : (
        <span className="empty-icon">
          <Icon name={icon} size={30} />
        </span>
      )}
      <h3>{t(title)}</h3>
      {description && <p>{t(description)}</p>}
      {children}
    </div>
  );
}

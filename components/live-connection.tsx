"use client";
import { Icon } from "./ui";
import { useProductLocale as useLocale } from "./product-locale";

export function LiveConnection({
  error,
  checking,
  lastUpdated,
  onRetry,
  projection = false,
}: {
  error: string;
  checking: boolean;
  lastUpdated?: number;
  onRetry: () => void;
  projection?: boolean;
}) {
  const { t, locale } = useLocale();
  return (
    <div className={`live-connection ${error ? "is-interrupted" : ""}`}>
      <div role="status" aria-atomic="true">
        {error && <Icon name="warning" size={18} />}
        <span>
          <strong>
            {t(error ? "Live updates interrupted" : "Updates connected")}
          </strong>
          {error && (
            <small>
              {t(
                projection
                  ? "Showing the last received slide. Reconnecting automatically."
                  : "Showing the last received state. You can keep writing while we reconnect.",
              )}
              {lastUpdated && (
                <>
                  {" "}
                  {t("Last received at {time}", {
                    time: new Date(lastUpdated).toLocaleTimeString(
                      locale === "tr" ? "tr-TR" : "en-GB",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false,
                      },
                    ),
                  })}
                </>
              )}
            </small>
          )}
        </span>
      </div>
      {error && (
        <button className="button" onClick={onRetry} disabled={checking}>
          {checking ? t("Reconnecting…") : t("Reconnect")}
        </button>
      )}
    </div>
  );
}

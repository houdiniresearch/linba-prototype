"use client";
import { useEffect, useState, type RefObject } from "react";
import type { User } from "@/lib/types";
import { useLocale } from "./locale-provider";
import { useTheme, type Theme } from "./theme-provider";
import { api, ErrorNote, Modal, ResourceFailure, useResource } from "./ui";
export function AccountSettings({
  open,
  user,
  onClose,
  onSaved,
  onWaitlist,
  returnFocusRef,
}: {
  open: boolean;
  user: User;
  onClose: () => void;
  onSaved: () => Promise<unknown>;
  onWaitlist: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const { t, locale, setLocale } = useLocale();
  const { theme, setTheme } = useTheme();
  const account = useResource<{ hasPassword: boolean; plan: string }>(
    "account",
    0,
    open,
  );
  const [tab, setTab] = useState("profile"),
    [name, setName] = useState(user.name),
    [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState(""),
    [newPassword, setNewPassword] = useState(""),
    [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    if (open) {
      setName(user.name);
      setEmail(user.email);
      setError("");
      setSaved(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    }
  }, [open, user.name, user.email]);
  async function save(action: "profile" | "security") {
    if (busy) return;
    setError("");
    setSaved(false);
    if (action === "security" && newPassword !== confirm) {
      setError("The new passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await api(
        "account",
        action === "profile"
          ? { name, email }
          : { currentPassword, newPassword },
        action === "profile" ? "PATCH" : "POST",
      );
      if (action === "profile") await onSaved();
      else {
        setCurrentPassword("");
        setNewPassword("");
        setConfirm("");
      }
      setSaved(true);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const titles: Record<string, string> = {
    profile: "My profile",
    security: "Security",
    billing: "Billing & payments",
    preferences: "General preferences",
  };
  return (
    <Modal
      open={open}
      onClose={() => !busy && onClose()}
      closeDisabled={busy}
      title={t("Settings")}
      className="account-settings-modal"
      returnFocusRef={returnFocusRef}
    >
      <div className="account-settings-layout">
        <nav aria-label={t("Settings sections")}>
          {Object.entries(titles).map(([key, title]) => (
            <button
              key={key}
              type="button"
              aria-current={tab === key ? "page" : undefined}
              disabled={busy}
              onClick={() => {
                setTab(key);
                setError("");
                setSaved(false);
              }}
            >
              {t(title)}
            </button>
          ))}
        </nav>
        <section
          className="account-settings-content"
          aria-labelledby="account-settings-section"
        >
          <h3 id="account-settings-section">{t(titles[tab])}</h3>
          {tab === "profile" && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void save("profile");
              }}
            >
              <div className="settings-profile-avatar">
                <span className="avatar">
                  {name.trim().slice(0, 1).toLocaleUpperCase(locale)}
                </span>
                <div>
                  <strong>{user.name}</strong>
                  <span>
                    {t(user.demo ? "Experience account" : "Instructor")}
                  </span>
                </div>
              </div>
              <label>
                {t("Full name")}
                <input
                  autoComplete="name"
                  maxLength={80}
                  value={name}
                  disabled={busy}
                  required
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <label>
                {t("Email")}
                <input
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  value={email}
                  disabled={busy || user.demo}
                  required={!user.demo}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <ErrorNote message={error} />
              {saved && (
                <p className="success-text" role="status">
                  {t("Profile updated.")}
                </p>
              )}
              <button
                className="button primary"
                disabled={busy || !name.trim()}
              >
                {t(busy ? "Saving…" : "Save profile")}
              </button>
            </form>
          )}
          {tab === "security" &&
            (!account.data ? (
              account.error ? (
                <ResourceFailure
                  error={account.error}
                  onRetry={account.refresh}
                />
              ) : (
                <p role="status">{t("Loading…")}</p>
              )
            ) : account.data.hasPassword ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void save("security");
                }}
              >
                <p className="muted">
                  {t(
                    "Change your password. Other sessions will be signed out.",
                  )}
                </p>
                <label>
                  {t("Current password")}
                  <input
                    type="password"
                    autoComplete="current-password"
                    maxLength={128}
                    value={currentPassword}
                    disabled={busy}
                    required
                    onChange={(event) => setCurrentPassword(event.target.value)}
                  />
                </label>
                <label>
                  {t("New password")}
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    value={newPassword}
                    disabled={busy}
                    required
                    onChange={(event) => setNewPassword(event.target.value)}
                  />
                </label>
                <label>
                  {t("Confirm new password")}
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    value={confirm}
                    disabled={busy}
                    required
                    onChange={(event) => setConfirm(event.target.value)}
                  />
                </label>
                <ErrorNote message={error} />
                {saved && (
                  <p className="success-text" role="status">
                    {t("Password updated.")}
                  </p>
                )}
                <button className="button primary" disabled={busy}>
                  {t(busy ? "Saving…" : "Update password")}
                </button>
              </form>
            ) : (
              <p className="muted">
                {t("Password settings are available for registered accounts.")}
              </p>
            ))}
          {tab === "billing" && (
            <div className="settings-billing">
              <div>
                <span>{t("Current plan")}</span>
                <strong>{t("Free")}</strong>
                <p>{t("Your account has no active paid subscription.")}</p>
              </div>
              <button
                className="button mint"
                onClick={() => {
                  onClose();
                  onWaitlist();
                }}
              >
                {t("Join the waitlist")}
              </button>
              <h4>{t("Invoices")}</h4>
              <p className="muted">{t("No invoices yet.")}</p>
            </div>
          )}
          {tab === "preferences" && (
            <div>
              <p className="muted">
                {t("These preferences apply across your workspace.")}
              </p>
              <label>
                {t("Language")}
                <select
                  value={locale}
                  onChange={(event) =>
                    setLocale(event.target.value as "tr" | "en")
                  }
                >
                  <option value="tr">Türkçe</option>
                  <option value="en">English</option>
                </select>
              </label>
              <label>
                {t("Appearance")}
                <select
                  value={theme}
                  onChange={(event) => setTheme(event.target.value as Theme)}
                >
                  <option value="light">{t("Light")}</option>
                  <option value="dark">{t("Dark")}</option>
                  <option value="system">{t("System")}</option>
                </select>
              </label>
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
}
export function WorkspaceHelp({
  open,
  onClose,
  onTraining,
  onReports,
  returnFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  onTraining: () => void;
  onReports: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const { t } = useLocale();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("How can we help?")}
      returnFocusRef={returnFocusRef}
      className="workspace-help-modal"
    >
      <p className="muted">{t("A few useful places to get started.")}</p>
      <div className="workspace-help-topics">
        <details open>
          <summary>{t("Prepare and reuse training")}</summary>
          <p>
            {t(
              "Upload your material, add activities and practice. After a session ends, use the training again to prepare a fresh session with its own participants and report.",
            )}
          </p>
          <button
            className="text-button"
            onClick={() => {
              onClose();
              onTraining();
            }}
          >
            {t("Open my training")}
          </button>
        </details>
        <details>
          <summary>{t("Find a session’s report")}</summary>
          <p>
            {t(
              "Reports are separate for each session. Use the dates and time filters to find the group you are looking for.",
            )}
          </p>
          <button
            className="text-button"
            onClick={() => {
              onClose();
              onReports();
            }}
          >
            {t("View reports")}
          </button>
        </details>
        <details>
          <summary>{t("Groups and Trash")}</summary>
          <p>
            {t(
              "Create groups in My training to organize your library. Moving training to Trash keeps its records; restore it whenever you need it.",
            )}
          </p>
        </details>
      </div>
    </Modal>
  );
}

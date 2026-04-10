"use client";

import { useId, type ReactNode } from "react";

import {
  CatalogButton,
  CatalogCard,
  StatusBadge,
  cx,
} from "@/features/catalog/components/catalog-primitives";
import { useUiI18n } from "@/features/i18n/components/ui-i18n-provider";

type FieldGroupProps = Readonly<{
  children: ReactNode;
  hint?: string;
  label: string;
}>;

export function FieldGroup({ children, hint, label }: FieldGroupProps) {
  const labelId = useId();
  const hintId = useId();

  return (
    <div aria-describedby={hint ? hintId : undefined} aria-labelledby={labelId} role="group">
      <label className="block text-[11px] font-bold uppercase tracking-[0.04em] text-muted" id={labelId}>
        {label}
      </label>
      <div className="mt-[5px]">{children}</div>
      {hint ? (
        <p className="mt-[3px] text-[11.5px] leading-[1.5] text-muted" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type SelectFieldProps = Readonly<{
  disabled?: boolean;
  onChange?: (value: string) => void;
  options: readonly string[];
  value: string;
}>;

export function SelectField({
  disabled = false,
  onChange,
  options,
  value,
}: SelectFieldProps) {
  return (
    <select
      className={cx(
        "w-full appearance-none rounded-[7px] border border-border-strong bg-surface-subtle px-[11px] py-2 text-[13px] font-[inherit] text-foreground outline-none transition-[border-color,box-shadow,background] dark:hover:border-white/20",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:border-foreground/20 hover:bg-surface-muted focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-glow)]",
      )}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
      value={value}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

type PillGroupProps = Readonly<{
  multi?: boolean;
  onChange?: (value: string) => void;
  onToggle?: (value: string) => void;
  options: readonly string[];
  selected: string | readonly string[];
}>;

export function PillGroup({ multi = false, onChange, onToggle, options, selected }: PillGroupProps) {
  function isSelected(opt: string) {
    return Array.isArray(selected) ? selected.includes(opt) : selected === opt;
  }

  function handleClick(opt: string) {
    if (multi) {
      onToggle?.(opt);
    } else {
      onChange?.(opt);
    }
  }

  return (
    <div className="flex flex-wrap gap-[7px]">
      {options.map((opt) => (
        <button
          key={opt}
          className={cx(
            "cursor-pointer rounded-[6px] border px-3 py-[5px] text-[12px] font-medium tracking-[-0.01em] transition active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            isSelected(opt)
              ? "border-accent bg-accent-dim font-semibold text-accent"
              : "border-border-strong bg-surface-subtle text-muted hover:border-foreground/22 hover:bg-surface-muted hover:text-foreground",
          )}
          onClick={() => handleClick(opt)}
          type="button"
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

type TextFieldProps = Readonly<{
  disabled?: boolean;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: "email" | "password" | "text";
  value: string;
}>;

export function TextField({
  disabled = false,
  onChange,
  placeholder,
  type = "text",
  value,
}: TextFieldProps) {
  return (
    <input
      className={cx(
        "w-full rounded-[7px] border border-border-strong bg-surface-subtle px-[11px] py-2 text-[13px] font-[inherit] text-foreground outline-none transition-[border-color,box-shadow,background] placeholder:text-muted/55 dark:hover:border-white/20 dark:hover:bg-surface-muted",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "hover:border-foreground/20 hover:bg-surface-muted focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-glow)]",
      )}
      disabled={disabled}
      onChange={(event) => onChange?.(event.target.value)}
      placeholder={placeholder}
      type={type}
      value={value}
    />
  );
}

type SegmentedControlProps = Readonly<{
  options: readonly { active?: boolean; label: string }[];
}>;

export function SegmentedControl({ options }: SegmentedControlProps) {
  return (
    <div className="inline-flex rounded-xl bg-surface-muted p-1">
      {options.map((option) => (
        <button
          key={option.label}
          className={cx(
            "cursor-pointer rounded-[0.8rem] px-4 py-2 text-sm font-semibold transition active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            option.active
              ? "bg-card text-foreground shadow-[0_6px_16px_rgba(20,34,53,0.08)] dark:shadow-[0_10px_24px_rgba(2,6,23,0.32)]"
              : "text-muted hover:text-foreground",
          )}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

type SettingsTabButtonProps = Readonly<{
  active?: boolean;
  icon?: ReactNode;
  label: string;
  onClick?: () => void;
}>;

export function SettingsTabButton({
  active = false,
  icon,
  label,
  onClick,
}: SettingsTabButtonProps) {
  return (
    <button
      className={cx(
        "flex w-full cursor-pointer items-center gap-[9px] rounded-[7px] px-[11px] py-2 text-left text-[13px] font-medium tracking-[-0.01em] transition active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        active
          ? "bg-accent-dim font-semibold text-accent"
          : "text-muted hover:bg-white/[0.047] hover:text-foreground",
      )}
      onClick={onClick}
      type="button"
    >
      {icon ? (
        <span className={cx("shrink-0", active ? "opacity-100" : "opacity-50")}>{icon}</span>
      ) : null}
      {label}
    </button>
  );
}

type ToggleRowProps = Readonly<{
  description: string;
  disabled?: boolean;
  enabled?: boolean;
  onToggle?: () => void;
  title: string;
}>;

export function ToggleRow({
  description,
  disabled = false,
  enabled = false,
  onToggle,
  title,
}: ToggleRowProps) {
  const { t } = useUiI18n();

  return (
    <div className="flex items-center gap-4 border-b border-border py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-foreground">{title}</p>
        <p className="mt-[3px] text-[11.5px] leading-[1.5] text-muted">{description}</p>
      </div>
      <button
        aria-label={t("settingsPage.actions.toggle", `Toggle ${title}`, { title })}
        disabled={disabled}
        aria-pressed={enabled}
        className={cx(
          "relative h-[18px] w-8 shrink-0 cursor-pointer rounded-full border transition focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60",
          enabled
            ? "border-accent bg-accent hover:border-accent-strong hover:bg-accent-strong"
            : "border-white/10 bg-white/10 hover:border-white/20 hover:bg-white/15 dark:border-white/10 dark:bg-white/10 dark:hover:border-white/22",
        )}
        onClick={onToggle}
        type="button"
      >
        <span
          className={cx(
            "absolute top-[3px] h-3 w-3 rounded-full shadow transition-transform",
            enabled ? "translate-x-[18px] bg-white" : "translate-x-[2px] bg-white/45",
          )}
        />
      </button>
    </div>
  );
}

type PreferencePanelProps = Readonly<{
  children: ReactNode;
  description: string;
  title: string;
}>;

export function PreferencePanel({
  children,
  description,
  title,
}: PreferencePanelProps) {
  return (
    <CatalogCard className="px-[22px] py-5">
      <div>
        <h3 className="text-[14px] font-bold tracking-[-0.015em] text-foreground">{title}</h3>
        <p className="mt-[3px] text-[12px] leading-[1.5] text-muted">{description}</p>
      </div>
      <div className="mt-[18px]">{children}</div>
    </CatalogCard>
  );
}

type DialogFrameProps = Readonly<{
  children: ReactNode;
  description: string;
  footer?: ReactNode;
  stepLabel?: string;
  title: string;
}>;

export function DialogFrame({
  children,
  description,
  footer,
  onClose,
  stepLabel,
  title,
}: DialogFrameProps & Readonly<{ onClose?: () => void }>) {
  const { t } = useUiI18n();
  const titleId = useId();
  const descriptionId = useId();

  return (
    <div
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      aria-modal="true"
      className="w-full max-w-[440px] overflow-hidden rounded-[12px] border border-border-strong bg-card shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
      role="dialog"
    >
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 pb-[14px] pt-4">
        <div>
          {stepLabel ? <StatusBadge label={stepLabel} tone="info" /> : null}
          <h3
            className={cx("text-[14px] font-bold tracking-[-0.015em] text-foreground", stepLabel ? "mt-2" : "")}
            id={titleId}
          >
            {title}
          </h3>
          <p className="mt-[2px] text-[12px] leading-[1.4] text-muted" id={descriptionId}>
            {description}
          </p>
        </div>
        <button
          aria-label={t("common.closeDialog", "Close dialog")}
          className="-mt-[2px] shrink-0 cursor-pointer rounded-[5px] p-[2px] text-lg leading-none text-muted transition hover:bg-surface-subtle hover:text-foreground active:scale-[.93] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
      </div>
      <div className="flex flex-col gap-[14px] px-5 py-[18px]">{children}</div>
      {footer ? (
        <div className="flex justify-end gap-2 border-t border-border px-5 pb-4 pt-3">{footer}</div>
      ) : null}
    </div>
  );
}

type TeamMemberRowProps = Readonly<{
  accessSummary: string;
  email: string;
  isCurrentUser?: boolean;
  name: string;
  onAction?: () => void;
  actionLabel?: string;
  role: string;
  status: "active" | "invited";
  statusLabel: string;
}>;

export function TeamMemberRow({
  accessSummary,
  actionLabel,
  email,
  isCurrentUser = false,
  name,
  onAction,
  role,
  status,
  statusLabel,
}: TeamMemberRowProps) {
  const { t } = useUiI18n();

  return (
    <div className="flex items-center gap-[10px] border-b border-border py-[11px] px-[18px] text-[13px] last:border-b-0 transition-colors hover:bg-white/[0.025]">
      <div className="flex min-w-0 flex-1 items-center gap-[10px]">
        <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#1d4166] text-[10.5px] font-bold text-white">
          {name
            .split(" ")
            .map((part) => part.charAt(0))
            .join("")
            .slice(0, 2)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-semibold text-foreground">{name}</p>
            {isCurrentUser ? <StatusBadge label={t("settingsPage.team.youBadge", "You")} tone="info" /> : null}
          </div>
          <p className="text-[11px] text-muted">{email}</p>
          <p className="mt-[2px] text-[10.5px] uppercase tracking-[0.08em] text-muted/80">
            {accessSummary}
          </p>
        </div>
      </div>
      <StatusBadge label={role} tone="neutral" />
      <span
        className={cx(
          "flex items-center gap-[5px] text-[12px] font-medium",
          status === "active" ? "text-green-400" : "text-muted",
        )}
      >
        <span
          className={cx(
            "h-[6px] w-[6px] shrink-0 rounded-full",
            status === "active" ? "bg-green-400" : "bg-muted",
          )}
        />
        {statusLabel}
      </span>
      {actionLabel && onAction ? (
        <button
          className="cursor-pointer rounded-[7px] border border-border-strong bg-surface-subtle px-3 py-1.5 text-[12px] font-semibold text-foreground transition-[border-color,background] hover:bg-surface-muted hover:border-foreground/20"
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

type IntegrationListItemProps = Readonly<{
  actionLabel: string;
  description: string;
  onAction?: () => void;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
  statusLabel: string;
  statusTone: "danger" | "neutral" | "success" | "warning";
  title: string;
}>;

const INTEGRATION_LOGO_STYLE: Record<string, string> = {
  danger:  "bg-[rgba(239,68,68,.12)] text-[#f87171]",
  warning: "bg-[rgba(245,158,11,.12)] text-[#fbbf24]",
  success: "bg-[rgba(34,197,94,.12)] text-[#4ade80]",
  neutral: "bg-[rgba(255,255,255,.05)] text-muted",
};

export function IntegrationListItem({
  actionLabel,
  description,
  onAction,
  onSecondaryAction,
  secondaryActionLabel,
  statusLabel,
  statusTone,
  title,
}: IntegrationListItemProps) {
  const logoStyle = INTEGRATION_LOGO_STYLE[statusTone] ?? INTEGRATION_LOGO_STYLE.neutral;
  const initial = title.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-[14px] border-b border-border px-[18px] py-[13px] transition-colors last:border-b-0 hover:bg-white/[0.02]">
      <span
        className={cx(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] text-[13px] font-extrabold",
          logoStyle,
        )}
      >
        {initial}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[13px] font-semibold text-foreground">{title}</p>
          <StatusBadge label={statusLabel} tone={statusTone} />
        </div>
        <p className="mt-[2px] text-[11.5px] leading-[1.4] text-muted">{description}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <CatalogButton onClick={onAction} variant="secondary">
          {actionLabel}
        </CatalogButton>
        {secondaryActionLabel ? (
          <CatalogButton onClick={onSecondaryAction} variant="ghost">
            {secondaryActionLabel}
          </CatalogButton>
        ) : null}
      </div>
    </div>
  );
}

type SessionRowProps = Readonly<{
  actionLabel?: string;
  detail: string;
  isCurrent?: boolean;
  onAction?: () => void;
  title: string;
}>;

export function SessionRow({
  actionLabel,
  detail,
  isCurrent = false,
  onAction,
  title,
}: SessionRowProps) {
  const { t } = useUiI18n();

  return (
    <div className="flex flex-col gap-3 border-b border-border px-5 py-4 last:border-b-0 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-foreground">{title}</p>
          {isCurrent ? <StatusBadge label={t("settingsPage.security.currentBadge", "Current")} tone="success" /> : null}
        </div>
        <p className="mt-1 text-xs leading-6 text-muted">{detail}</p>
      </div>
      {actionLabel ? (
        <CatalogButton onClick={onAction} variant="ghost">
          {actionLabel}
        </CatalogButton>
      ) : null}
    </div>
  );
}

type ApiKeyRowProps = Readonly<{
  actionLabel: string;
  createdLabel: string;
  keyLabel: string;
  name: string;
  onAction?: () => void;
}>;

export function ApiKeyRow({
  actionLabel,
  createdLabel,
  keyLabel,
  name,
  onAction,
}: ApiKeyRowProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border px-5 py-4 last:border-b-0 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{name}</p>
        <p className="mt-1 truncate font-mono text-xs text-muted">{keyLabel}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted">{createdLabel}</span>
        <button
          className="cursor-pointer rounded-[7px] px-3 py-2 text-sm font-semibold text-accent transition hover:bg-accent/10 active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

type SettingsActionRowProps = Readonly<{
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  primaryLabel: string;
  secondaryLabel: string;
}>;

export function SettingsActionRow({
  onPrimaryAction,
  onSecondaryAction,
  primaryLabel,
  secondaryLabel,
}: SettingsActionRowProps) {
  return (
    <div className="mt-[18px] flex flex-wrap items-center gap-2 border-t border-border pt-[14px]">
      <CatalogButton onClick={onPrimaryAction} variant="primary">
        {primaryLabel}
      </CatalogButton>
      <CatalogButton onClick={onSecondaryAction} variant="secondary">
        {secondaryLabel}
      </CatalogButton>
    </div>
  );
}

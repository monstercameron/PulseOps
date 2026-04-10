"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { cx } from "@/features/catalog/components/catalog-primitives";
import {
  type DashboardFilterControl,
  type DashboardFilters,
} from "@/features/dashboard/constants/dashboard-page-content";
import {
  dashboardDefaultFilterValues,
  hasActiveDashboardFilters,
  readDashboardFilterValues,
} from "@/features/dashboard/lib/dashboard-filters";
import {
  applyDashboardFilterControlChange,
  buildDashboardFilterUrl,
} from "@/features/dashboard/lib/dashboard-filter-navigation";
import { useUiI18n } from "@/features/i18n/components/ui-i18n-provider";

type DashboardFilterBarProps = Readonly<{
  filters: DashboardFilters;
}>;

export function DashboardFilterBar({ filters }: DashboardFilterBarProps) {
  const { t } = useUiI18n();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const selectedValues = readDashboardFilterValues({
    dateRange: searchParams.get("dateRange"),
    documentType: searchParams.get("documentType"),
    source: searchParams.get("source"),
    status: searchParams.get("status"),
  });
  const hasActiveFilters = hasActiveDashboardFilters(selectedValues);

  function commitFilterChange(
    nextValues: ReturnType<typeof readDashboardFilterValues>,
  ) {
    const nextUrl = buildDashboardFilterUrl({
      nextValues,
      pathname,
      searchParams: searchParams.toString(),
    });

    startTransition(() => {
      router.replace(nextUrl, { scroll: false });
      router.refresh();
    });
  }

  function handleControlChange(
    controlId: keyof typeof dashboardDefaultFilterValues,
    value: string,
  ) {
    commitFilterChange(
      applyDashboardFilterControlChange({
        controlId,
        selectedValues,
        value,
      }),
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          aria-label={t("common.resetDashboardFilters", "Reset dashboard filters")}
          className={getChipClasses(!hasActiveFilters, isPending)}
          onClick={() => commitFilterChange(dashboardDefaultFilterValues)}
          type="button"
        >
          {filters.workspaceLabel}
        </button>

        {filters.controls.map((control) => (
          <DashboardFilterSelectChip
            key={control.id}
            active={selectedValues[control.id] !== dashboardDefaultFilterValues[control.id]}
            control={control}
            currentValue={selectedValues[control.id]}
            disabled={isPending}
            onChange={(value) => handleControlChange(control.id, value)}
          />
        ))}
      </div>

      <div
        aria-live="polite"
        className={cx(
          "inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium",
          isPending
            ? "border-accent/25 bg-accent/10 text-accent"
            : "border-border bg-card text-muted",
        )}
      >
        <span
          className={cx(
            "h-1.5 w-1.5 rounded-full",
            isPending ? "animate-pulse bg-accent" : "bg-green-500",
          )}
        />
        <span>
          {isPending
            ? t("dashboardPage.filters.refreshing", "Refreshing this dashboard view...")
            : t("dashboardPage.filters.live", "Live view ready")}
        </span>
      </div>
    </div>
  );
}

type DashboardFilterSelectChipProps = Readonly<{
  active: boolean;
  control: DashboardFilterControl;
  currentValue: string;
  disabled: boolean;
  onChange: (value: string) => void;
}>;

function DashboardFilterSelectChip({
  active,
  control,
  currentValue,
  disabled,
  onChange,
}: DashboardFilterSelectChipProps) {
  return (
    <div className="relative">
      <label className="sr-only" htmlFor={`dashboard-filter-${control.id}`}>
        {control.label}
      </label>
      <select
        className={cx(
          getChipClasses(active, disabled),
          "appearance-none pe-8",
        )}
        disabled={disabled}
        id={`dashboard-filter-${control.id}`}
        onChange={(event) => onChange(event.target.value)}
        value={currentValue}
      >
        {control.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-[10px] text-current/70"
      >
        v
      </span>
    </div>
  );
}

function getChipClasses(active: boolean, disabled: boolean) {
  return cx(
    "inline-flex min-h-[34px] items-center rounded-[8px] border px-3 py-1.5 text-[12.5px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-background",
    active
      ? "border-accent bg-accent/10 text-accent"
      : "border-border bg-card text-muted hover:border-foreground/15 hover:bg-surface-subtle hover:text-foreground dark:hover:bg-surface-muted",
    disabled ? "cursor-wait opacity-70" : "cursor-pointer active:scale-[.97]",
  );
}

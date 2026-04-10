"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

import { cx } from "@/features/catalog/components/catalog-primitives";

const sidebarStorageKey = "sidebar-collapsed";

type NavItem = Readonly<{
  href: string;
  Icon: () => ReactNode;
  label: string;
  mobileLabel: string;
}>;

const primaryNav: readonly NavItem[] = [
  { href: "/dashboard", label: "Dashboard", mobileLabel: "Home", Icon: IconDashboard },
  { href: "/pipeline", label: "Pipeline", mobileLabel: "Pipeline", Icon: IconPipeline },
  { href: "/explorer", label: "Explorer", mobileLabel: "Explorer", Icon: IconExplorer },
  { href: "/packs", label: "Decision Packs", mobileLabel: "Packs", Icon: IconPacks },
  { href: "/ask", label: "Ask", mobileLabel: "Ask", Icon: IconAsk },
];

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(sidebarStorageKey) === "true";
  });

  function toggleSidebar() {
    setIsCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(sidebarStorageKey, String(next));
      return next;
    });
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <aside
        className={cx(
          "hidden shrink-0 flex-col overflow-x-hidden overflow-y-auto bg-[#060e18] transition-[width] duration-200 min-[901px]:flex",
          isCollapsed
            ? "w-12 border-r border-white/[0.065]"
            : "w-[220px] border-r border-white/[0.065]",
        )}
        suppressHydrationWarning
      >
        <div
          className={cx(
            "flex items-center gap-2.5",
            isCollapsed ? "justify-center px-0 pb-3 pt-5" : "px-4 pb-3.5 pt-5",
          )}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-[#00c9a7] text-[12px] font-black text-[#0d1b2a]">
            P
          </span>
          {!isCollapsed ? (
            <>
              <span className="text-[15px] font-bold tracking-[-0.02em] text-white">
                Pulse<span className="text-[#00c9a7]">Ops</span>
              </span>
              <span
                className="ml-auto h-[7px] w-[7px] shrink-0 rounded-full bg-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.22)]"
                title="2 alerts need attention"
              />
            </>
          ) : null}
        </div>

        <button
          className={cx(
            "mx-[12px] mb-3.5 flex items-center gap-2 rounded-lg border border-white/[0.07] text-left transition hover:bg-white/[0.06] active:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00c9a7]/60 focus-visible:ring-inset",
            isCollapsed ? "mx-[6px] justify-center px-0 py-[5px]" : "px-[10px] py-[7px]",
          )}
          onClick={() => console.info("[PulseOps] Workspace switcher: not implemented yet.")}
          type="button"
        >
          <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[5px] bg-[#1d4166] text-[10px] font-bold text-white">
            B
          </span>
          {!isCollapsed ? (
            <>
              <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px] font-semibold text-white/85">
                Broward HVAC Co.
              </span>
              <span className="shrink-0 text-white/35">
                <IconChevron />
              </span>
            </>
          ) : null}
        </button>

        <nav className="flex flex-1 flex-col gap-0.5 px-2">
          {primaryNav.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
              collapsed={isCollapsed}
            />
          ))}
        </nav>

        <div className="mt-2 border-t border-white/[0.055] px-2 pb-3 pt-2">
          <NavLink
            active={pathname === "/settings" || pathname.startsWith("/settings/")}
            collapsed={isCollapsed}
            href="/settings"
            Icon={IconSettings}
            label="Settings"
            mobileLabel="Settings"
          />
          <div
            className={cx(
              "mt-2 border-t border-white/[0.055] pt-[10px]",
              isCollapsed ? "flex justify-center px-0" : "flex items-center gap-2.5 px-3",
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1d4166] text-[11px] font-bold text-white">
              JR
            </span>
            {!isCollapsed ? (
              <div className="min-w-0 flex-1">
                <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px] font-semibold text-white/80">
                  Jamie R.
                </div>
                <div className="text-[11px] text-white/35">Operator</div>
              </div>
            ) : null}
          </div>
        </div>

        <button
          aria-label="Toggle sidebar"
          className="flex h-8 items-center justify-center border-t border-white/[0.055] bg-transparent p-0 text-white/25 transition hover:bg-white/[0.04] hover:text-white/60 active:bg-white/[0.07] active:text-white/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00c9a7]/60 focus-visible:ring-inset"
          onClick={toggleSidebar}
          title="Toggle sidebar"
          type="button"
        >
          <span className={cx("transition-transform duration-200", isCollapsed ? "rotate-180" : "")}>
            <IconSidebarChevron />
          </span>
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background max-[900px]:pb-14">
        <main className="main-area flex min-w-0 flex-1 flex-col overflow-y-auto bg-background">
          {children}
        </main>
      </div>

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-50 hidden h-14 border-t border-white/[0.09] bg-[#0d1b2a] max-[900px]:flex"
      >
        <div className="flex h-full">
          {primaryNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                className={cx(
                  "flex flex-1 flex-col items-center justify-center gap-[3px] px-0 pb-[10px] pt-[7px] text-[9.5px] font-semibold tracking-[0.01em] transition active:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00c9a7]/60 focus-visible:ring-inset",
                  active ? "text-[#00c9a7]" : "text-white/[0.38]",
                )}
                href={item.href}
              >
                <item.Icon />
                <span>{item.mobileLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function NavLink({
  active,
  collapsed,
  href,
  Icon,
  label,
}: NavItem &
  Readonly<{
    active: boolean;
    collapsed: boolean;
  }>) {
  return (
    <Link
      className={cx(
        "group flex items-center rounded-[7px] font-medium tracking-[-0.01em] transition duration-100 active:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00c9a7]/60 focus-visible:ring-inset",
        active
          ? "bg-accent-dim text-[#00c9a7]"
          : "text-white/[0.38] hover:bg-white/[0.05] hover:text-white/[0.78]",
        collapsed ? "justify-center gap-0 px-0 py-2 text-[0px]" : "gap-[10px] px-[11px] py-2 text-[13px]",
      )}
      href={href}
    >
      <span className={cx("shrink-0 transition-opacity", active ? "opacity-100" : "opacity-[0.55] group-hover:opacity-[0.85]")}>
        <Icon />
      </span>
      {!collapsed ? <span>{label}</span> : null}
      {active && !collapsed ? (
        <span className="ml-auto h-[6px] w-[6px] shrink-0 rounded-full bg-[#00c9a7]" />
      ) : null}
    </Link>
  );
}

function IconDashboard() {
  return (
    <svg fill="currentColor" height="15" viewBox="0 0 20 20" width="15">
      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function IconPipeline() {
  return (
    <svg fill="currentColor" height="15" viewBox="0 0 20 20" width="15">
      <path
        clipRule="evenodd"
        d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z"
        fillRule="evenodd"
      />
    </svg>
  );
}

function IconExplorer() {
  return (
    <svg fill="currentColor" height="15" viewBox="0 0 20 20" width="15">
      <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
      <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
      <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
    </svg>
  );
}

function IconPacks() {
  return (
    <svg fill="currentColor" height="15" viewBox="0 0 20 20" width="15">
      <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
    </svg>
  );
}

function IconAsk() {
  return (
    <svg fill="currentColor" height="15" viewBox="0 0 20 20" width="15">
      <path
        clipRule="evenodd"
        d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
        fillRule="evenodd"
      />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg fill="currentColor" height="15" viewBox="0 0 20 20" width="15">
      <path
        clipRule="evenodd"
        d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
        fillRule="evenodd"
      />
    </svg>
  );
}

function IconChevron() {
  return (
    <svg fill="none" height="6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 10 6" width="10">
      <path d="M1 1l4 4 4-4" />
    </svg>
  );
}

function IconSidebarChevron() {
  return (
    <svg fill="currentColor" height="14" viewBox="0 0 20 20" width="14">
      <path
        clipRule="evenodd"
        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
        fillRule="evenodd"
      />
    </svg>
  );
}

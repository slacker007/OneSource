"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Drawer } from "@/components/ui/drawer";

type NavItem = {
  href: string;
  label: string;
  description: string;
};

const PRIMARY_NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    description: "Command view",
  },
  {
    href: "/opportunities",
    label: "Opportunities",
    description: "Pipeline records",
  },
  {
    href: "/sources",
    label: "Sources",
    description: "External intake",
  },
  {
    href: "/tasks",
    label: "Tasks",
    description: "Execution queue",
  },
  {
    href: "/analytics",
    label: "Analytics",
    description: "Outcome trends",
  },
];

const SETTINGS_NAV_ITEM: NavItem = {
  href: "/settings",
  label: "Settings",
  description: "Roles and audit",
};

type AuthenticatedAppShellProps = {
  allowWorkspaceSettings: boolean;
  children: ReactNode;
  sessionUser: {
    email?: string | null;
    name?: string | null;
    roleKeys: string[];
  };
};

type AppShellFrameProps = AuthenticatedAppShellProps & {
  currentPath: string;
};

export function AuthenticatedAppShell(props: AuthenticatedAppShellProps) {
  const pathname = usePathname() ?? "/";

  return <AppShellFrame currentPath={pathname} {...props} />;
}

export function AppShellFrame({
  allowWorkspaceSettings,
  children,
  currentPath,
  sessionUser,
}: AppShellFrameProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const secondaryNavItems = allowWorkspaceSettings ? [SETTINGS_NAV_ITEM] : [];
  const allItems = [...PRIMARY_NAV_ITEMS, ...secondaryNavItems];
  const activeItem =
    allItems.find((item) => isNavItemActive(item.href, currentPath)) ??
    PRIMARY_NAV_ITEMS[0];
  const activeLabel = activeItem.label;

  const displayName =
    sessionUser.name ?? sessionUser.email ?? "Authenticated user";
  const roleSummary =
    sessionUser.roleKeys.length > 0
      ? sessionUser.roleKeys.join(", ")
      : "No roles assigned";

  return (
    <div className="relative flex min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(32,95,85,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(168,93,42,0.1),transparent_24%)]">
      <Drawer
        description="Responsive workspace navigation now reuses a shared drawer pattern instead of a shell-only implementation."
        eyebrow="OneSource"
        onClose={() => setIsMobileNavOpen(false)}
        open={isMobileNavOpen}
        title="Capture workspace"
      >
        <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
          <p className="text-sm font-medium text-white">{displayName}</p>
          <p className="mt-1 text-sm text-stone-300">{sessionUser.email}</p>
          <p className="mt-3 text-xs tracking-[0.18em] text-stone-400 uppercase">
            {roleSummary}
          </p>
        </div>

        <NavigationList
          currentPath={currentPath}
          items={PRIMARY_NAV_ITEMS}
          onNavigate={() => setIsMobileNavOpen(false)}
          title="Mobile navigation"
        />

        {secondaryNavItems.length > 0 ? (
          <NavigationList
            currentPath={currentPath}
            items={secondaryNavItems}
            onNavigate={() => setIsMobileNavOpen(false)}
            title="Admin"
          />
        ) : null}
      </Drawer>

      <aside className="border-border hidden w-80 shrink-0 border-r bg-[rgba(15,28,31,0.98)] px-6 py-6 text-stone-100 lg:flex lg:flex-col lg:justify-between">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-stone-200">
              <span className="h-2.5 w-2.5 rounded-full bg-[#dca167]" />
              OneSource
            </div>
            <div className="space-y-3">
              <p className="font-heading text-3xl leading-tight font-semibold">
                Capture intelligence for the next serious bid.
              </p>
              <p className="text-sm leading-6 text-stone-300">
                The authenticated shell is now the stable workspace boundary for
                navigation, permissions, and future opportunity modules.
              </p>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-sm font-medium text-white">{displayName}</p>
            <p className="mt-1 text-sm text-stone-300">{sessionUser.email}</p>
            <p className="mt-3 text-xs tracking-[0.18em] text-stone-400 uppercase">
              {roleSummary}
            </p>
          </div>

          <NavigationList
            currentPath={currentPath}
            items={PRIMARY_NAV_ITEMS}
            title="Primary navigation"
          />

          {secondaryNavItems.length > 0 ? (
            <NavigationList
              currentPath={currentPath}
              items={secondaryNavItems}
              title="Admin"
            />
          ) : null}
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 px-4 py-4">
          <p className="text-xs tracking-[0.24em] text-stone-400 uppercase">
            Current shell
          </p>
          <p className="mt-3 text-sm leading-6 text-stone-200">
            `P3-01` establishes the shared sidebar, top bar, responsive menu,
            and global search placeholder used across the authenticated app.
          </p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="border-border/80 sticky top-0 z-20 border-b bg-[rgba(247,243,232,0.88)] px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
            <div className="flex items-center gap-3 lg:hidden">
              <button
                aria-controls="mobile-navigation"
                aria-expanded={isMobileNavOpen}
                aria-label="Open navigation menu"
                className="border-border text-foreground inline-flex h-11 w-11 items-center justify-center rounded-full border bg-white text-sm font-medium shadow-[0_10px_24px_rgba(20,37,34,0.08)]"
                onClick={() => setIsMobileNavOpen(true)}
                type="button"
              >
                Menu
              </button>
              <div>
                <p className="text-muted text-xs tracking-[0.24em] uppercase">
                  OneSource
                </p>
                <p className="font-heading text-xl font-semibold">
                  {activeLabel}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="space-y-1">
                <p className="text-muted hidden text-xs tracking-[0.24em] uppercase lg:block">
                  Authenticated workspace
                </p>
                <p className="font-heading hidden text-3xl font-semibold tracking-[-0.04em] lg:block">
                  {activeLabel}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:min-w-[42rem] xl:justify-end">
                <label className="relative block sm:flex-1 xl:max-w-xl">
                  <span className="sr-only">Global search</span>
                  <input
                    aria-label="Global search"
                    className="border-border text-foreground w-full rounded-full border bg-white px-4 py-3 text-sm shadow-[0_12px_28px_rgba(20,37,34,0.06)] transition outline-none focus:border-[rgba(32,95,85,0.4)]"
                    placeholder="Search opportunities, agencies, or notice IDs"
                    readOnly
                    type="search"
                  />
                </label>
                <div className="hidden text-right sm:block">
                  <p className="text-foreground text-sm font-medium">
                    {displayName}
                  </p>
                  <p className="text-muted text-xs">{sessionUser.email}</p>
                </div>
                <SignOutButton />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function NavigationList({
  currentPath,
  items,
  onNavigate,
  title,
}: {
  currentPath: string;
  items: NavItem[];
  onNavigate?: () => void;
  title: string;
}) {
  return (
    <nav aria-label={title} className="space-y-3">
      <p className="text-xs tracking-[0.24em] text-stone-400 uppercase">
        {title}
      </p>
      <div className="space-y-2">
        {items.map((item) => {
          const active = isNavItemActive(item.href, currentPath);

          return (
            <Link
              key={item.href}
              aria-current={active ? "page" : undefined}
              className={`block rounded-[22px] px-4 py-3 transition ${
                active
                  ? "bg-white/12 text-white shadow-[0_12px_30px_rgba(15,28,31,0.18)]"
                  : "text-stone-300 hover:bg-white/6 hover:text-white"
              }`}
              href={item.href}
              onClick={onNavigate}
            >
              <span className="block text-sm font-medium">{item.label}</span>
              <span className="mt-1 block text-xs text-current/70">
                {item.description}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function isNavItemActive(href: string, currentPath: string) {
  if (href === "/") {
    return currentPath === "/";
  }

  return currentPath === href || currentPath.startsWith(`${href}/`);
}

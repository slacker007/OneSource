"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore, type ReactNode } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Drawer } from "@/components/ui/drawer";
import { hasAppPermission } from "@/lib/auth/permissions";
import { cn } from "@/lib/cn";

const SHELL_COLLAPSE_STORAGE_KEY = "onesource.shell.is-collapsed";
const SHELL_RECENT_DESTINATIONS_STORAGE_KEY =
  "onesource.shell.recent-destinations";
const SHELL_PREFERENCES_EVENT = "onesource.shell.preferences-changed";
const SHELL_RECENT_DESTINATION_LIMIT = 4;

type NavItem = {
  description: string;
  href: string;
  label: string;
};

type NavGroup = {
  description: string;
  items: NavItem[];
  title: string;
};

type ShellRouteDefinition = {
  description: string;
  label: string;
  matcher: string;
  navHref: string;
  requires?: "decision_support" | "workspace_settings";
};

type RecentDestination = {
  description: string;
  href: string;
  label: string;
  navHref: string;
};

const BASE_NAV_GROUPS: NavGroup[] = [
  {
    title: "Capture command",
    description: "Daily oversight and execution",
    items: [
      {
        href: "/",
        label: "Dashboard",
        description: "Monitor the attention queue and active pipeline.",
      },
      {
        href: "/opportunities",
        label: "Opportunities",
        description: "Review tracked pursuits and open workspaces.",
      },
      {
        href: "/tasks",
        label: "Tasks",
        description: "Triage assigned delivery work and reminders.",
      },
    ],
  },
  {
    title: "Intelligence",
    description: "Discovery, context, and decision support",
    items: [
      {
        href: "/sources",
        label: "Sources",
        description: "Search external opportunities and imports.",
      },
      {
        href: "/knowledge",
        label: "Knowledge",
        description: "Browse reusable capture and proposal content.",
      },
      {
        href: "/analytics",
        label: "Analytics",
        description: "Compare ranked pursuits and portfolio trends.",
      },
    ],
  },
];

const SETTINGS_NAV_GROUP: NavGroup = {
  title: "Workspace admin",
  description: "Operator controls and oversight",
  items: [
    {
      href: "/settings",
      label: "Settings",
      description: "Manage workspace controls, roles, and audit views.",
    },
  ],
};

const SHELL_ROUTE_DEFINITIONS: ShellRouteDefinition[] = [
  {
    matcher: "/settings",
    label: "Workspace settings",
    description: "Operate users, connectors, saved searches, and audit controls.",
    navHref: "/settings",
    requires: "workspace_settings",
  },
  {
    matcher: "/analytics",
    label: "Decision console",
    description: "Review bid recommendations, score trends, and outcomes.",
    navHref: "/analytics",
    requires: "decision_support",
  },
  {
    matcher: "/opportunities/new",
    label: "Create pursuit",
    description: "Start a new tracked opportunity with validated reference data.",
    navHref: "/opportunities",
  },
  {
    matcher: "/opportunities/",
    label: "Opportunity workspace",
    description: "Execute capture work inside one pursuit workspace.",
    navHref: "/opportunities",
  },
  {
    matcher: "/opportunities",
    label: "Opportunity pipeline",
    description: "Scan the pipeline with filters, preview, and list controls.",
    navHref: "/opportunities",
  },
  {
    matcher: "/knowledge/new",
    label: "Create knowledge asset",
    description: "Capture reusable content and retrieval tags for later work.",
    navHref: "/knowledge",
  },
  {
    matcher: "/knowledge/",
    label: "Edit knowledge asset",
    description: "Update reusable content, tags, and linked pursuits.",
    navHref: "/knowledge",
  },
  {
    matcher: "/knowledge",
    label: "Knowledge library",
    description: "Browse reusable assets, taxonomy filters, and linked pursuits.",
    navHref: "/knowledge",
  },
  {
    matcher: "/sources",
    label: "External discovery",
    description: "Search source systems, review previews, and import opportunities.",
    navHref: "/sources",
  },
  {
    matcher: "/tasks",
    label: "My tasks",
    description: "Work the current queue of assigned tasks and reminders.",
    navHref: "/tasks",
  },
  {
    matcher: "/",
    label: "Dashboard",
    description: "Track active pipeline pressure, deadlines, and top pursuits.",
    navHref: "/",
  },
];

type AuthenticatedAppShellProps = {
  allowDecisionSupport: boolean;
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
  allowDecisionSupport,
  allowWorkspaceSettings,
  children,
  currentPath,
  sessionUser,
}: AppShellFrameProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const collapsedRailSnapshot = useSyncExternalStore(
    subscribeToShellPreferenceChanges,
    readCollapsedRailPreferenceSnapshot,
    () => "0",
  );
  const recentDestinationsSnapshot = useSyncExternalStore(
    subscribeToShellPreferenceChanges,
    readRecentDestinationsSnapshot,
    () => "[]",
  );
  const isRailCollapsed = collapsedRailSnapshot === "1";
  const recentDestinations = parseRecentDestinationsSnapshot(
    recentDestinationsSnapshot,
  );

  const canManagePipeline = hasAppPermission(
    sessionUser.roleKeys,
    "manage_pipeline",
  );
  const canManageSourceSearches = hasAppPermission(
    sessionUser.roleKeys,
    "manage_source_searches",
  );

  const navGroups = buildNavGroups({
    allowDecisionSupport,
    allowWorkspaceSettings,
  });
  const navItems = navGroups.flatMap((group) => group.items);
  const activeDestination =
    getCurrentDestination({
      allowDecisionSupport,
      allowWorkspaceSettings,
      currentPath,
    }) ?? createDestination(navItems[0]);
  const activeNavItem =
    navItems.find((item) => item.href === activeDestination.navHref) ?? navItems[0];
  const activeGroup =
    navGroups.find((group) =>
      group.items.some((item) => item.href === activeNavItem.href),
    ) ?? navGroups[0];
  const quickLinks = buildQuickLinks({
    allowDecisionSupport,
    allowWorkspaceSettings,
    canManagePipeline,
    canManageSourceSearches,
  });
  const visibleRecentDestinations = recentDestinations.filter(
    (destination) => destination.href !== currentPath,
  );

  const displayName =
    sessionUser.name ?? sessionUser.email ?? "Authenticated user";
  const roleSummary =
    sessionUser.roleKeys.length > 0
      ? sessionUser.roleKeys.join(", ")
      : "No roles assigned";

  function rememberDestination(href: string) {
    const destination = getCurrentDestination({
      allowDecisionSupport,
      allowWorkspaceSettings,
      currentPath: href,
    });

    if (!destination) {
      return;
    }

    const nextDestinations = [destination, ...recentDestinations].filter(
      (item, index, items) =>
        items.findIndex((candidate) => candidate.href === item.href) === index,
    );
    const trimmedDestinations = nextDestinations.slice(
      0,
      SHELL_RECENT_DESTINATION_LIMIT,
    );

    try {
      window.localStorage.setItem(
        SHELL_RECENT_DESTINATIONS_STORAGE_KEY,
        JSON.stringify(trimmedDestinations),
      );
      emitShellPreferenceChange();
    } catch {
      // Ignore storage failures; recent work should not block navigation.
    }
  }

  const desktopShell = (
    <aside
      className={cn(
        "border-border hidden shrink-0 border-r bg-[rgba(15,28,31,0.98)] py-6 text-stone-100 lg:flex lg:flex-col lg:justify-between",
        isRailCollapsed ? "w-64 px-4" : "w-[21rem] px-6",
      )}
    >
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-stone-200">
              <span className="h-2.5 w-2.5 rounded-full bg-[#dca167]" />
              OneSource
            </div>
            {!isRailCollapsed ? (
              <div className="space-y-2">
                <p className="font-heading text-3xl leading-tight font-semibold">
                  Capture command, discovery, and execution in one rail.
                </p>
                <p className="text-sm leading-6 text-stone-300">
                  Grouped navigation keeps operators oriented while quick links
                  and recent work stay attached to the shell instead of drifting
                  into page-specific shortcuts.
                </p>
              </div>
            ) : null}
          </div>
          <button
            aria-label={
              isRailCollapsed
                ? "Expand navigation rail"
                : "Collapse navigation rail"
            }
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium tracking-[0.18em] uppercase text-stone-200 transition hover:bg-white/10"
            onClick={() => updateCollapsedRailPreference(!isRailCollapsed)}
            type="button"
          >
            {isRailCollapsed ? "Expand" : "Collapse"}
          </button>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
          <p className="text-sm font-medium text-white">{displayName}</p>
          <p className="mt-1 text-sm text-stone-300">{sessionUser.email}</p>
          <p className="mt-3 text-xs tracking-[0.18em] text-stone-400 uppercase">
            {roleSummary}
          </p>
        </div>

        <NavigationMenu
          collapsed={isRailCollapsed}
          currentPath={currentPath}
          groups={navGroups}
          onRememberDestination={rememberDestination}
          title="Primary navigation"
        />

        <QuickLinksPanel
          collapsed={isRailCollapsed}
          currentPath={currentPath}
          links={quickLinks}
          onRememberDestination={rememberDestination}
        />

        <RecentWorkPanel
          collapsed={isRailCollapsed}
          destinations={visibleRecentDestinations}
        />
      </div>

      <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
        <p className="text-xs tracking-[0.24em] text-stone-400 uppercase">
          Current focus
        </p>
        <p className="font-heading mt-3 text-2xl font-semibold text-white">
          {activeDestination.label}
        </p>
        {!isRailCollapsed ? (
          <p className="mt-3 text-sm leading-6 text-stone-300">
            {activeDestination.description}
          </p>
        ) : null}
      </div>
    </aside>
  );

  return (
    <div className="relative flex min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(32,95,85,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(168,93,42,0.1),transparent_24%)]">
      <Drawer
        description="Responsive grouped navigation now keeps quick links and recent work in the mobile shell instead of scattering them across individual routes."
        eyebrow="OneSource"
        onClose={() => setIsMobileNavOpen(false)}
        open={isMobileNavOpen}
        title="OneSource workspace"
      >
        <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
          <p className="text-sm font-medium text-white">{displayName}</p>
          <p className="mt-1 text-sm text-stone-300">{sessionUser.email}</p>
          <p className="mt-3 text-xs tracking-[0.18em] text-stone-400 uppercase">
            {roleSummary}
          </p>
        </div>

        <NavigationMenu
          currentPath={currentPath}
          groups={navGroups}
          onNavigate={() => setIsMobileNavOpen(false)}
          onRememberDestination={rememberDestination}
          title="Mobile navigation"
        />

        <QuickLinksPanel
          currentPath={currentPath}
          links={quickLinks}
          mobile
          onRememberDestination={rememberDestination}
        />

        <RecentWorkPanel
          destinations={visibleRecentDestinations}
          mobile
          onNavigate={() => setIsMobileNavOpen(false)}
          onRememberDestination={rememberDestination}
        />
      </Drawer>

      {desktopShell}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="border-border/80 sticky top-0 z-20 border-b bg-[rgba(247,243,232,0.88)] px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
            <div className="flex items-center justify-between gap-4 lg:hidden">
              <div className="flex items-center gap-3">
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
                    {activeGroup.title}
                  </p>
                  <p className="font-heading text-xl font-semibold">
                    {activeDestination.label}
                  </p>
                </div>
              </div>
              <div className="sm:hidden">
                <SignOutButton />
              </div>
            </div>

            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-2">
                <p className="text-muted hidden text-xs tracking-[0.24em] uppercase lg:block">
                  {activeGroup.title}
                </p>
                <p className="font-heading hidden text-3xl font-semibold tracking-[-0.04em] lg:block">
                  {activeDestination.label}
                </p>
                <p className="text-muted max-w-2xl text-sm leading-6">
                  {activeDestination.description}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:min-w-[42rem] xl:justify-end">
                <label className="relative block sm:flex-1 xl:max-w-xl">
                  <span className="sr-only">Global search</span>
                  <input
                    aria-label="Global search"
                    className="border-border text-foreground w-full rounded-full border bg-white px-4 py-3 pr-16 text-sm shadow-[0_12px_28px_rgba(20,37,34,0.06)] transition outline-none focus:border-[rgba(32,95,85,0.4)]"
                    placeholder="Search opportunities, agencies, or notice IDs"
                    readOnly
                    type="search"
                  />
                  <span className="text-muted pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 rounded-full border border-[rgba(18,33,40,0.12)] bg-[rgba(18,33,40,0.04)] px-2 py-1 text-[0.68rem] tracking-[0.18em] uppercase">
                    Shell
                  </span>
                </label>
                <div className="hidden text-right sm:block">
                  <p className="text-foreground text-sm font-medium">
                    {displayName}
                  </p>
                  <p className="text-muted text-xs">{sessionUser.email}</p>
                </div>
                <div className="hidden sm:block">
                  <SignOutButton />
                </div>
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

function NavigationMenu({
  collapsed = false,
  currentPath,
  groups,
  onNavigate,
  onRememberDestination,
  title,
}: {
  collapsed?: boolean;
  currentPath: string;
  groups: NavGroup[];
  onNavigate?: () => void;
  onRememberDestination?: (href: string) => void;
  title: string;
}) {
  return (
    <nav aria-label={title} className="space-y-5">
      {groups.map((group) => (
        <section key={group.title} className="space-y-2">
          <div>
            <p className="text-xs tracking-[0.24em] text-stone-400 uppercase">
              {group.title}
            </p>
            {!collapsed ? (
              <p className="mt-1 text-xs leading-5 text-stone-500">
                {group.description}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            {group.items.map((item) => {
              const active = isRouteActive(item.href, currentPath);

              return (
                <Link
                  key={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block rounded-[20px] border px-4 py-3 transition",
                    active
                      ? "border-white/18 bg-white/12 text-white shadow-[0_12px_30px_rgba(15,28,31,0.18)]"
                      : "border-transparent text-stone-300 hover:border-white/10 hover:bg-white/6 hover:text-white",
                  )}
                  href={item.href}
                  onClick={() => {
                    onNavigate?.();
                    onRememberDestination?.(item.href);
                  }}
                >
                  <span className="block text-sm font-medium">{item.label}</span>
                  {!collapsed ? (
                    <span className="mt-1 block text-xs leading-5 text-current/72">
                      {item.description}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );
}

function QuickLinksPanel({
  collapsed = false,
  currentPath,
  links,
  mobile = false,
  onRememberDestination,
}: {
  collapsed?: boolean;
  currentPath: string;
  links: NavItem[];
  mobile?: boolean;
  onRememberDestination?: (href: string) => void;
}) {
  return (
    <section
      className={cn(
        "rounded-[24px] border border-white/10 bg-white/5 px-4 py-4",
        mobile ? "mt-5" : "",
      )}
    >
      <p className="text-xs tracking-[0.24em] text-stone-400 uppercase">
        Quick links
      </p>
      {!collapsed ? (
        <p className="mt-1 text-xs leading-5 text-stone-500">
          Frequent jumps that stay attached to the shell.
        </p>
      ) : null}
      <div className="mt-3 space-y-2">
        {links.map((link) => {
          const active = isRouteActive(link.href, currentPath);

          return (
            <Link
              key={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "block rounded-[18px] border px-3 py-3 transition",
                active
                  ? "border-white/16 bg-white/12 text-white"
                  : "border-transparent text-stone-300 hover:border-white/10 hover:bg-white/6 hover:text-white",
              )}
              href={link.href}
              onClick={() => onRememberDestination?.(link.href)}
            >
              <span className="block text-sm font-medium">{link.label}</span>
              {!collapsed ? (
                <span className="mt-1 block text-xs leading-5 text-current/72">
                  {link.description}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function RecentWorkPanel({
  collapsed = false,
  destinations,
  mobile = false,
  onNavigate,
  onRememberDestination,
}: {
  collapsed?: boolean;
  destinations: RecentDestination[];
  mobile?: boolean;
  onNavigate?: () => void;
  onRememberDestination?: (href: string) => void;
}) {
  return (
    <section
      className={cn(
        "rounded-[24px] border border-white/10 bg-white/5 px-4 py-4",
        mobile ? "mt-5" : "",
      )}
    >
      <p className="text-xs tracking-[0.24em] text-stone-400 uppercase">
        Recent work
      </p>
      {!collapsed ? (
        <p className="mt-1 text-xs leading-5 text-stone-500">
          Resume the most recent shell destinations without page-specific links.
        </p>
      ) : null}

      {destinations.length > 0 ? (
        <div className="mt-3 space-y-2">
          {destinations.map((destination) => (
            <Link
              key={destination.href}
              className="block rounded-[18px] border border-transparent px-3 py-3 text-stone-300 transition hover:border-white/10 hover:bg-white/6 hover:text-white"
              href={destination.href}
              onClick={() => {
                onNavigate?.();
                onRememberDestination?.(destination.href);
              }}
            >
              <span className="block text-sm font-medium">
                {destination.label}
              </span>
              {!collapsed ? (
                <span className="mt-1 block text-xs leading-5 text-current/72">
                  {destination.description}
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-stone-400">
          Visit another workspace area and it will appear here for quick return.
        </p>
      )}
    </section>
  );
}

function buildNavGroups({
  allowDecisionSupport,
  allowWorkspaceSettings,
}: {
  allowDecisionSupport: boolean;
  allowWorkspaceSettings: boolean;
}) {
  const groups = BASE_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => allowDecisionSupport || item.href !== "/analytics",
    ),
  }));

  if (allowWorkspaceSettings) {
    groups.push(SETTINGS_NAV_GROUP);
  }

  return groups;
}

function buildQuickLinks({
  allowDecisionSupport,
  allowWorkspaceSettings,
  canManagePipeline,
  canManageSourceSearches,
}: {
  allowDecisionSupport: boolean;
  allowWorkspaceSettings: boolean;
  canManagePipeline: boolean;
  canManageSourceSearches: boolean;
}) {
  const quickLinks: NavItem[] = [
    {
      href: "/opportunities",
      label: "Open pipeline",
      description: "Return to tracked opportunities and saved filters.",
    },
    {
      href: "/tasks",
      label: "Review my tasks",
      description: "Work the queue of assigned tasks and reminders.",
    },
  ];

  if (canManagePipeline) {
    quickLinks.unshift({
      href: "/opportunities/new",
      label: "Create pursuit",
      description: "Open the new tracked opportunity workflow.",
    });
  }

  if (canManageSourceSearches) {
    quickLinks.push({
      href: "/sources",
      label: "Review sources",
      description: "Run external discovery and inspect import previews.",
    });
  }

  if (allowDecisionSupport) {
    quickLinks.push({
      href: "/analytics",
      label: "Decision console",
      description: "Compare ranked pursuits and outcome trends.",
    });
  }

  if (allowWorkspaceSettings) {
    quickLinks.push({
      href: "/settings",
      label: "Workspace settings",
      description: "Open users, connectors, audit, and scoring controls.",
    });
  }

  return quickLinks;
}

function getCurrentDestination({
  allowDecisionSupport,
  allowWorkspaceSettings,
  currentPath,
}: {
  allowDecisionSupport: boolean;
  allowWorkspaceSettings: boolean;
  currentPath: string;
}) {
  const definition = SHELL_ROUTE_DEFINITIONS.find((candidate) => {
    if (
      candidate.requires === "decision_support" &&
      !allowDecisionSupport
    ) {
      return false;
    }

    if (
      candidate.requires === "workspace_settings" &&
      !allowWorkspaceSettings
    ) {
      return false;
    }

    return isRouteActive(candidate.matcher, currentPath);
  });

  if (!definition) {
    return null;
  }

  return {
    description: definition.description,
    href: currentPath,
    label: definition.label,
    navHref: definition.navHref,
  } satisfies RecentDestination;
}

function createDestination(item: NavItem): RecentDestination {
  return {
    description: item.description,
    href: item.href,
    label: item.label,
    navHref: item.href,
  };
}

function isRouteActive(href: string, currentPath: string) {
  if (href === "/") {
    return currentPath === "/";
  }

  if (href.endsWith("/")) {
    return currentPath.startsWith(href);
  }

  return currentPath === href || currentPath.startsWith(`${href}/`);
}

function subscribeToShellPreferenceChanges(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleChange = () => {
    onStoreChange();
  };

  window.addEventListener("storage", handleChange);
  window.addEventListener(SHELL_PREFERENCES_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(SHELL_PREFERENCES_EVENT, handleChange);
  };
}

function readCollapsedRailPreferenceSnapshot() {
  if (typeof window === "undefined") {
    return "0";
  }

  try {
    return window.localStorage.getItem(SHELL_COLLAPSE_STORAGE_KEY) ?? "0";
  } catch {
    return "0";
  }
}

function readRecentDestinationsSnapshot() {
  if (typeof window === "undefined") {
    return "[]";
  }

  try {
    return (
      window.localStorage.getItem(
        SHELL_RECENT_DESTINATIONS_STORAGE_KEY,
      ) ?? "[]"
    );
  } catch {
    return "[]";
  }
}

function parseRecentDestinationsSnapshot(snapshot: string) {
  try {
    const parsedValue = JSON.parse(snapshot) as unknown;

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .filter(isRecentDestination)
      .slice(0, SHELL_RECENT_DESTINATION_LIMIT);
  } catch {
    return [];
  }
}

function emitShellPreferenceChange() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(SHELL_PREFERENCES_EVENT));
}

function updateCollapsedRailPreference(value: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      SHELL_COLLAPSE_STORAGE_KEY,
      value ? "1" : "0",
    );
    emitShellPreferenceChange();
  } catch {
    // Ignore storage failures; the shell should remain usable without persistence.
  }
}

function isRecentDestination(value: unknown): value is RecentDestination {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.description === "string" &&
    typeof candidate.href === "string" &&
    typeof candidate.label === "string" &&
    typeof candidate.navHref === "string"
  );
}

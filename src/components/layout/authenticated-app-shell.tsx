"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { hasAppPermission } from "@/lib/auth/permissions";
import { cn } from "@/lib/cn";
import type {
  AppShellCommandCategory,
  AppShellCommandItem,
  AppShellSnapshot,
  AppShellWorkbenchItem,
} from "@/modules/shell/app-shell.types";

const SHELL_COLLAPSE_STORAGE_KEY = "onesource.shell.is-collapsed";
const SHELL_PINNED_ITEMS_STORAGE_KEY = "onesource.shell.pinned-items";
const SHELL_PREFERENCES_EVENT = "onesource.shell.preferences-changed";
const SHELL_RECENT_DESTINATIONS_STORAGE_KEY =
  "onesource.shell.recent-destinations";
const SHELL_PINNED_ITEM_LIMIT = 6;
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
    organizationId: string;
    roleKeys: string[];
    userId: string;
  };
  shellSnapshot: AppShellSnapshot;
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
  shellSnapshot,
}: AppShellFrameProps) {
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const collapsedRailSnapshot = useSyncExternalStore(
    subscribeToShellPreferenceChanges,
    readCollapsedRailPreferenceSnapshot,
    () => "0",
  );
  const recentItemsSnapshot = useSyncExternalStore(
    subscribeToShellPreferenceChanges,
    readRecentWorkbenchItemsSnapshot,
    () => "[]",
  );
  const pinnedItemsSnapshot = useSyncExternalStore(
    subscribeToShellPreferenceChanges,
    readPinnedWorkbenchItemsSnapshot,
    () => "[]",
  );
  const commandInputRef = useRef<HTMLInputElement>(null);
  const commandListboxId = useId();
  const commandOptionIdPrefix = useId();
  const deferredCommandQuery = useDeferredValue(commandQuery);
  const [activeCommandItemId, setActiveCommandItemId] = useState<string | null>(
    null,
  );
  const isRailCollapsed = collapsedRailSnapshot === "1";
  const pinnedItems = parseWorkbenchItemsSnapshot(
    pinnedItemsSnapshot,
    SHELL_PINNED_ITEM_LIMIT,
  );
  const recentItems = parseWorkbenchItemsSnapshot(
    recentItemsSnapshot,
    SHELL_RECENT_DESTINATION_LIMIT,
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
    }) ?? createWorkbenchItemFromNavItem(navItems[0]);
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
  const visibleRecentItems = recentItems.filter((item) => item.href !== currentPath);
  const quickCreateItems = buildQuickCreateItems({
    allowDecisionSupport,
    allowWorkspaceSettings,
    canManagePipeline,
    canManageSourceSearches,
  });
  const shellViewItems = buildShellViewCommandItems({
    navGroups,
    quickLinks,
  });
  const commandSections = filterCommandSections({
    query: deferredCommandQuery,
    sections: [
      {
        key: "quick_create",
        label: "Quick create",
        items: quickCreateItems,
      },
      {
        key: "pinned",
        label: "Pinned work",
        items: pinnedItems.map(createCommandItemFromWorkbenchItem),
      },
      {
        key: "recent",
        label: "Recent work",
        items: visibleRecentItems.map(createCommandItemFromWorkbenchItem),
      },
      {
        key: "views",
        label: "Shell views",
        items: shellViewItems,
      },
      ...shellSnapshot.commandSections,
    ],
  });
  const flatCommandItems = commandSections.flatMap((section) => section.items);
  const resolvedActiveCommandItemId = flatCommandItems.some(
    (item) => item.id === activeCommandItemId,
  )
    ? activeCommandItemId
    : flatCommandItems[0]?.id ?? null;
  const notificationCount = shellSnapshot.notifications.totalCount;

  const displayName =
    sessionUser.name ?? sessionUser.email ?? "Authenticated user";
  const roleSummary =
    sessionUser.roleKeys.length > 0
      ? sessionUser.roleKeys.join(", ")
      : "No roles assigned";

  useEffect(() => {
    if (!isCommandOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      commandInputRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isCommandOpen]);

  useEffect(() => {
    function handleKeyboardShortcut(event: globalThis.KeyboardEvent) {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setIsCommandOpen(true);
      }
    }

    window.addEventListener("keydown", handleKeyboardShortcut);

    return () => {
      window.removeEventListener("keydown", handleKeyboardShortcut);
    };
  }, []);

  function rememberRecentItem(item: AppShellWorkbenchItem) {
    const nextItems = [item, ...recentItems].filter(
      (candidate, index, items) =>
        items.findIndex((entry) => entry.href === candidate.href) === index,
    );

    writeWorkbenchItemsPreference({
      key: SHELL_RECENT_DESTINATIONS_STORAGE_KEY,
      limit: SHELL_RECENT_DESTINATION_LIMIT,
      items: nextItems,
    });
  }

  function togglePinnedItem(item: AppShellWorkbenchItem) {
    const existingPinnedItem = pinnedItems.find(
      (candidate) => candidate.href === item.href,
    );

    if (existingPinnedItem) {
      writeWorkbenchItemsPreference({
        key: SHELL_PINNED_ITEMS_STORAGE_KEY,
        limit: SHELL_PINNED_ITEM_LIMIT,
        items: pinnedItems.filter((candidate) => candidate.href !== item.href),
      });
      return;
    }

    writeWorkbenchItemsPreference({
      key: SHELL_PINNED_ITEMS_STORAGE_KEY,
      limit: SHELL_PINNED_ITEM_LIMIT,
      items: [item, ...pinnedItems],
    });
  }

  function closeCommandSurface() {
    setIsCommandOpen(false);
    setCommandQuery("");
    setActiveCommandItemId(null);
  }

  function handleCommandItemSelection(item: AppShellWorkbenchItem) {
    rememberRecentItem(item);
    closeCommandSurface();
  }

  function focusCommandItem(itemId: string) {
    const link = document.getElementById(getCommandLinkId(commandOptionIdPrefix, itemId));
    link?.focus();
  }

  function moveCommandSelection(direction: "next" | "previous") {
    if (flatCommandItems.length === 0) {
      return;
    }

    const currentIndex = flatCommandItems.findIndex(
      (item) => item.id === resolvedActiveCommandItemId,
    );
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex =
      direction === "next"
        ? (safeIndex + 1) % flatCommandItems.length
        : (safeIndex - 1 + flatCommandItems.length) % flatCommandItems.length;
    const nextItem = flatCommandItems[nextIndex];

    if (!nextItem) {
      return;
    }

    setActiveCommandItemId(nextItem.id);
    focusCommandItem(nextItem.id);
  }

  function handleCommandInputKeyDown(
    event: ReactKeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveCommandSelection("next");
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveCommandSelection("previous");
      return;
    }

    if (event.key === "Enter") {
      if (!resolvedActiveCommandItemId) {
        return;
      }

      event.preventDefault();
      const link = document.getElementById(
        getCommandLinkId(commandOptionIdPrefix, resolvedActiveCommandItemId),
      );
      link?.click();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeCommandSurface();
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
                  Grouped navigation now feeds a command center with pinned work,
                  recent context, and alert review instead of leaving the shell as
                  a passive frame.
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
          onRememberItem={rememberRecentItem}
          title="Primary navigation"
        />

        <QuickLinksPanel
          collapsed={isRailCollapsed}
          currentPath={currentPath}
          links={quickLinks}
          onRememberItem={rememberRecentItem}
        />

        <PinnedWorkPanel
          collapsed={isRailCollapsed}
          items={pinnedItems}
          onRememberItem={rememberRecentItem}
          onTogglePinnedItem={togglePinnedItem}
        />

        <RecentWorkPanel
          collapsed={isRailCollapsed}
          items={visibleRecentItems}
          onRememberItem={rememberRecentItem}
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
    <div className="relative flex min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(32,95,85,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(168,93,42,0.1),transparent_24%)]">
      <Drawer
        description="Responsive grouped navigation now keeps quick links, pinned work, and recent work in the mobile shell instead of scattering them across individual routes."
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
          onRememberItem={rememberRecentItem}
          title="Mobile navigation"
        />

        <QuickLinksPanel
          currentPath={currentPath}
          links={quickLinks}
          mobile
          onRememberItem={rememberRecentItem}
        />

        <PinnedWorkPanel
          items={pinnedItems}
          mobile
          onNavigate={() => setIsMobileNavOpen(false)}
          onRememberItem={rememberRecentItem}
          onTogglePinnedItem={togglePinnedItem}
        />

        <RecentWorkPanel
          items={visibleRecentItems}
          mobile
          onNavigate={() => setIsMobileNavOpen(false)}
          onRememberItem={rememberRecentItem}
        />
      </Drawer>

      <Dialog
        description="Use the keyboard or the result list to jump to core views, quick-create flows, active pursuits, assigned tasks, saved searches, or recent knowledge."
        footer={
          <div className="flex flex-col gap-2 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>Use ↑ and ↓ to move, then press Enter to open the selected result.</p>
            <p>{flatCommandItems.length} items available in the shell command center.</p>
          </div>
        }
        onClose={closeCommandSurface}
        open={isCommandOpen}
        title="Command center"
      >
        <div className="space-y-4">
          <label className="block">
            <span className="sr-only">Command search</span>
            <input
              aria-activedescendant={
                resolvedActiveCommandItemId
                  ? getCommandOptionId(
                      commandOptionIdPrefix,
                      resolvedActiveCommandItemId,
                    )
                  : undefined
              }
              aria-controls={commandListboxId}
              aria-label="Command search"
              className="border-border text-foreground w-full rounded-[24px] border bg-white px-4 py-3 text-sm shadow-[0_12px_28px_rgba(20,37,34,0.06)] transition outline-none focus:border-[rgba(32,95,85,0.4)]"
              onChange={(event) => setCommandQuery(event.target.value)}
              onKeyDown={handleCommandInputKeyDown}
              placeholder="Search workspaces, tasks, knowledge, or saved searches"
              ref={commandInputRef}
              type="search"
              value={commandQuery}
            />
          </label>

          {flatCommandItems.length > 0 ? (
            <div
              aria-label="Command results"
              className="max-h-[28rem] space-y-4 overflow-y-auto pr-1"
              id={commandListboxId}
              role="listbox"
            >
              {commandSections.map((section) => (
                <section key={section.key} className="space-y-2">
                  <p className="text-muted text-xs tracking-[0.22em] uppercase">
                    {section.label}
                  </p>
                  <div className="space-y-2">
                    {section.items.map((item) => {
                      const optionId = getCommandOptionId(
                        commandOptionIdPrefix,
                        item.id,
                      );
                      const isPinned = pinnedItems.some(
                        (pinnedItem) => pinnedItem.href === item.href,
                      );
                      const workbenchItem =
                        createWorkbenchItemFromCommandItem(item);

                      return (
                        <div
                          aria-selected={resolvedActiveCommandItemId === item.id}
                          className={cn(
                            "rounded-[24px] border bg-white/72 p-2 transition",
                            resolvedActiveCommandItemId === item.id
                              ? "border-[rgba(32,95,85,0.28)] shadow-[0_16px_36px_rgba(20,37,34,0.12)]"
                              : "border-[rgba(15,28,31,0.08)]",
                          )}
                          id={optionId}
                          key={item.id}
                          onMouseEnter={() => setActiveCommandItemId(item.id)}
                          role="option"
                        >
                          <div className="flex items-start gap-2">
                            <Link
                              className="flex-1 rounded-[20px] px-3 py-3 transition hover:bg-[rgba(32,95,85,0.06)] focus:bg-[rgba(32,95,85,0.08)] focus:outline-none"
                              href={item.href}
                              id={getCommandLinkId(commandOptionIdPrefix, item.id)}
                              onClick={() => handleCommandItemSelection(workbenchItem)}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-medium text-foreground">
                                  {item.label}
                                </span>
                                <span className="text-muted text-[0.68rem] tracking-[0.18em] uppercase">
                                  {formatCommandCategoryLabel(item.category)}
                                </span>
                              </div>
                              <p className="mt-1 text-sm leading-6 text-muted">
                                {item.description}
                              </p>
                              {item.supportingText ? (
                                <p className="mt-2 text-xs tracking-[0.16em] text-muted uppercase">
                                  {item.supportingText}
                                </p>
                              ) : null}
                            </Link>
                            <button
                              aria-label={
                                isPinned
                                  ? `Remove ${item.label} from pinned work`
                                  : `Pin ${item.label} to pinned work`
                              }
                              className={cn(
                                "rounded-full border px-3 py-2 text-xs font-medium tracking-[0.16em] uppercase transition",
                                isPinned
                                  ? "border-[rgba(32,95,85,0.22)] bg-[rgba(32,95,85,0.12)] text-foreground"
                                  : "border-border bg-white text-muted hover:border-[rgba(32,95,85,0.2)] hover:text-foreground",
                              )}
                              onClick={() => togglePinnedItem(workbenchItem)}
                              type="button"
                            >
                              {isPinned ? "Pinned" : "Pin"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-border bg-white/70 px-5 py-8 text-sm leading-6 text-muted">
              No shell results match the current command query. Try a pursuit
              title, task name, knowledge asset, or saved search.
            </div>
          )}
        </div>
      </Dialog>

      <Dialog
        description="Review high-signal reminders and connector issues without leaving the shell."
        onClose={() => setIsNotificationsOpen(false)}
        open={isNotificationsOpen}
        title="Notifications"
      >
        {shellSnapshot.notifications.items.length > 0 ? (
          <div className="space-y-3">
            {shellSnapshot.notifications.items.map((notification) => (
              <Link
                className="block rounded-[24px] border border-[rgba(15,28,31,0.08)] bg-white px-5 py-4 transition hover:border-[rgba(32,95,85,0.2)] hover:bg-[rgba(32,95,85,0.04)]"
                href={notification.href}
                key={notification.id}
                onClick={() => setIsNotificationsOpen(false)}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">
                    {notification.title}
                  </p>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[0.68rem] tracking-[0.16em] uppercase",
                      notification.tone === "danger"
                        ? "bg-[rgba(173,70,49,0.12)] text-[#8f3422]"
                        : notification.tone === "warning"
                          ? "bg-[rgba(220,161,103,0.16)] text-[#8b5e2d]"
                          : "bg-[rgba(32,95,85,0.12)] text-[#1b5f53]",
                    )}
                  >
                    {notification.tone}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {notification.summary}
                </p>
                {notification.timestamp ? (
                  <p className="mt-2 text-xs tracking-[0.16em] text-muted uppercase">
                    {formatDateTime(notification.timestamp)}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-border bg-white/70 px-5 py-8 text-sm leading-6 text-muted">
            No active alerts are queued in the shell right now. Overdue tasks,
            upcoming reminders, and saved-search issues will appear here.
          </div>
        )}
      </Dialog>

      {desktopShell}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="border-border/80 sticky top-0 z-20 border-b bg-[rgba(247,243,232,0.88)] px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl min-w-0 flex-col gap-4">
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

              <div className="flex flex-col gap-3 xl:min-w-[42rem] xl:items-end">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:w-full xl:justify-end">
                  <button
                    aria-expanded={isCommandOpen}
                    aria-haspopup="dialog"
                    aria-label="Open command search"
                    className="border-border flex flex-1 items-center justify-between rounded-full border bg-white px-4 py-3 text-left shadow-[0_12px_28px_rgba(20,37,34,0.06)] transition hover:border-[rgba(32,95,85,0.22)] xl:max-w-xl"
                    onClick={() => setIsCommandOpen(true)}
                    type="button"
                  >
                    <span className="text-sm text-muted">
                      Search work, tasks, knowledge, or saved searches
                    </span>
                    <span className="rounded-full border border-[rgba(18,33,40,0.12)] bg-[rgba(18,33,40,0.04)] px-2 py-1 text-[0.68rem] tracking-[0.18em] uppercase text-muted">
                      Cmd K
                    </span>
                  </button>
                  <button
                    aria-expanded={isNotificationsOpen}
                    aria-haspopup="dialog"
                    aria-label="Open notifications"
                    className="border-border inline-flex items-center justify-center gap-2 rounded-full border bg-white px-4 py-3 text-sm font-medium shadow-[0_12px_28px_rgba(20,37,34,0.06)] transition hover:border-[rgba(32,95,85,0.22)]"
                    onClick={() => setIsNotificationsOpen(true)}
                    type="button"
                  >
                    Alerts
                    <span className="rounded-full bg-[rgba(32,95,85,0.12)] px-2 py-1 text-xs text-foreground">
                      {notificationCount}
                    </span>
                  </button>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <div className="text-right">
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
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto min-w-0 max-w-7xl">{children}</div>
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
  onRememberItem,
  title,
}: {
  collapsed?: boolean;
  currentPath: string;
  groups: NavGroup[];
  onNavigate?: () => void;
  onRememberItem?: (item: AppShellWorkbenchItem) => void;
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
                    onRememberItem?.(createWorkbenchItemFromNavItem(item));
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
  onRememberItem,
}: {
  collapsed?: boolean;
  currentPath: string;
  links: NavItem[];
  mobile?: boolean;
  onRememberItem?: (item: AppShellWorkbenchItem) => void;
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
              onClick={() => onRememberItem?.(createWorkbenchItemFromNavItem(link))}
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

function PinnedWorkPanel({
  collapsed = false,
  items,
  mobile = false,
  onNavigate,
  onRememberItem,
  onTogglePinnedItem,
}: {
  collapsed?: boolean;
  items: AppShellWorkbenchItem[];
  mobile?: boolean;
  onNavigate?: () => void;
  onRememberItem?: (item: AppShellWorkbenchItem) => void;
  onTogglePinnedItem: (item: AppShellWorkbenchItem) => void;
}) {
  return (
    <section
      className={cn(
        "rounded-[24px] border border-white/10 bg-white/5 px-4 py-4",
        mobile ? "mt-5" : "",
      )}
    >
      <p className="text-xs tracking-[0.24em] text-stone-400 uppercase">
        Pinned work
      </p>
      {!collapsed ? (
        <p className="mt-1 text-xs leading-5 text-stone-500">
          Keep recurring pursuits, saved views, and quick return points visible in
          the shell.
        </p>
      ) : null}

      {items.length > 0 ? (
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <div
              className="rounded-[18px] border border-transparent px-3 py-3 transition hover:border-white/10 hover:bg-white/6"
              key={item.href}
            >
              <div className="flex items-start gap-2">
                <Link
                  className="flex-1 text-stone-300 transition hover:text-white"
                  href={item.href}
                  onClick={() => {
                    onNavigate?.();
                    onRememberItem?.(item);
                  }}
                >
                  <span className="block text-sm font-medium">{item.label}</span>
                  {!collapsed ? (
                    <>
                      <span className="mt-1 block text-xs leading-5 text-current/72">
                        {item.description}
                      </span>
                      {item.supportingText ? (
                        <span className="mt-2 block text-[0.68rem] tracking-[0.16em] text-current/56 uppercase">
                          {item.supportingText}
                        </span>
                      ) : null}
                    </>
                  ) : null}
                </Link>
                <button
                  aria-label={`Remove ${item.label} from pinned work`}
                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-2 text-[0.68rem] tracking-[0.16em] uppercase text-stone-300 transition hover:bg-white/10 hover:text-white"
                  onClick={() => onTogglePinnedItem(item)}
                  type="button"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-stone-400">
          Pin a pursuit or view from the command center and it will stay visible
          here.
        </p>
      )}
    </section>
  );
}

function RecentWorkPanel({
  collapsed = false,
  items,
  mobile = false,
  onNavigate,
  onRememberItem,
}: {
  collapsed?: boolean;
  items: AppShellWorkbenchItem[];
  mobile?: boolean;
  onNavigate?: () => void;
  onRememberItem?: (item: AppShellWorkbenchItem) => void;
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
          Resume the most recent shell views, pursuits, and quick-return items.
        </p>
      ) : null}

      {items.length > 0 ? (
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <Link
              key={item.href}
              className="block rounded-[18px] border border-transparent px-3 py-3 text-stone-300 transition hover:border-white/10 hover:bg-white/6 hover:text-white"
              href={item.href}
              onClick={() => {
                onNavigate?.();
                onRememberItem?.(item);
              }}
            >
              <span className="block text-sm font-medium">{item.label}</span>
              {!collapsed ? (
                <>
                  <span className="mt-1 block text-xs leading-5 text-current/72">
                    {item.description}
                  </span>
                  {item.supportingText ? (
                    <span className="mt-2 block text-[0.68rem] tracking-[0.16em] text-current/56 uppercase">
                      {item.supportingText}
                    </span>
                  ) : null}
                </>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-stone-400">
          Open a route or jump to work from the command center and it will appear
          here for quick return.
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

function buildQuickCreateItems({
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
  const items: AppShellCommandItem[] = [];

  if (canManagePipeline) {
    items.push({
      id: "quick-create-pursuit",
      category: "quick_create",
      description: "Open the validated tracked-opportunity creation workflow.",
      href: "/opportunities/new",
      label: "Create pursuit",
      navHref: "/opportunities",
      keywords: ["create", "new", "pursuit", "opportunity"],
      supportingText: "Quick create",
    });
    items.push({
      id: "quick-create-knowledge",
      category: "quick_create",
      description: "Capture reusable narrative, win themes, or past performance.",
      href: "/knowledge/new",
      label: "Create knowledge asset",
      navHref: "/knowledge",
      keywords: ["create", "knowledge", "asset", "win theme"],
      supportingText: "Quick create",
    });
  }

  if (canManageSourceSearches) {
    items.push({
      id: "quick-create-source-search",
      category: "quick_create",
      description: "Open external discovery with the current shell context intact.",
      href: "/sources",
      label: "Run source search",
      navHref: "/sources",
      keywords: ["search", "sources", "discovery", "sam.gov"],
      supportingText: "Quick action",
    });
  }

  if (allowDecisionSupport) {
    items.push({
      id: "quick-open-decision-console",
      category: "quick_create",
      description: "Jump to ranked pursuit review and portfolio decision support.",
      href: "/analytics",
      label: "Open decision console",
      navHref: "/analytics",
      keywords: ["decision", "analytics", "ranking"],
      supportingText: "Quick action",
    });
  }

  if (allowWorkspaceSettings) {
    items.push({
      id: "quick-open-settings",
      category: "quick_create",
      description: "Open workspace controls, connectors, and audit visibility.",
      href: "/settings",
      label: "Open workspace settings",
      navHref: "/settings",
      keywords: ["settings", "admin", "connectors", "audit"],
      supportingText: "Operator action",
    });
  }

  return items;
}

function buildShellViewCommandItems({
  navGroups,
  quickLinks,
}: {
  navGroups: NavGroup[];
  quickLinks: NavItem[];
}) {
  const workbenchItems = [...navGroups.flatMap((group) => group.items), ...quickLinks]
    .map(createWorkbenchItemFromNavItem)
    .filter(
      (candidate, index, items) =>
        items.findIndex((item) => item.href === candidate.href) === index,
    );

  return workbenchItems.map((item) => ({
    ...createCommandItemFromWorkbenchItem(item),
    keywords: [item.label, item.description, item.supportingText ?? ""].filter(Boolean),
  }));
}

function filterCommandSections({
  query,
  sections,
}: {
  query: string;
  sections: Array<{
    items: AppShellCommandItem[];
    key: string;
    label: string;
  }>;
}) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return sections.filter((section) => section.items.length > 0);
  }

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        [
          item.label,
          item.description,
          item.supportingText ?? "",
          ...item.keywords,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      ),
    }))
    .filter((section) => section.items.length > 0);
}

function createWorkbenchItemFromCommandItem(
  item: AppShellCommandItem,
): AppShellWorkbenchItem {
  return {
    category: item.category,
    description: item.description,
    href: item.href,
    label: item.label,
    navHref: item.navHref,
    supportingText: item.supportingText,
  };
}

function createCommandItemFromWorkbenchItem(
  item: AppShellWorkbenchItem,
): AppShellCommandItem {
  return {
    ...item,
    id: `${item.category}:${item.href}`,
    keywords: [item.label, item.description, item.supportingText ?? ""].filter(
      Boolean,
    ),
  };
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
    category: "view",
    description: definition.description,
    href: currentPath,
    label: definition.label,
    navHref: definition.navHref,
    supportingText: null,
  } satisfies AppShellWorkbenchItem;
}

function createWorkbenchItemFromNavItem(item: NavItem): AppShellWorkbenchItem {
  return {
    category: "view",
    description: item.description,
    href: item.href,
    label: item.label,
    navHref: item.href,
    supportingText: "Shell view",
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

function readRecentWorkbenchItemsSnapshot() {
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

function readPinnedWorkbenchItemsSnapshot() {
  if (typeof window === "undefined") {
    return "[]";
  }

  try {
    return window.localStorage.getItem(SHELL_PINNED_ITEMS_STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function parseWorkbenchItemsSnapshot(snapshot: string, limit: number) {
  try {
    const parsedValue = JSON.parse(snapshot) as unknown;

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .map(normalizeWorkbenchItem)
      .filter((item): item is AppShellWorkbenchItem => item !== null)
      .slice(0, limit);
  } catch {
    return [];
  }
}

function normalizeWorkbenchItem(value: unknown): AppShellWorkbenchItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.description !== "string" ||
    typeof candidate.href !== "string" ||
    typeof candidate.label !== "string" ||
    typeof candidate.navHref !== "string"
  ) {
    return null;
  }

  return {
    category: isCommandCategory(candidate.category) ? candidate.category : "view",
    description: candidate.description,
    href: candidate.href,
    label: candidate.label,
    navHref: candidate.navHref,
    supportingText:
      typeof candidate.supportingText === "string"
        ? candidate.supportingText
        : null,
  };
}

function writeWorkbenchItemsPreference({
  key,
  items,
  limit,
}: {
  items: AppShellWorkbenchItem[];
  key: string;
  limit: number;
}) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      key,
      JSON.stringify(
        items
          .filter(
            (item, index, allItems) =>
              allItems.findIndex((candidate) => candidate.href === item.href) ===
              index,
          )
          .slice(0, limit),
      ),
    );
    emitShellPreferenceChange();
  } catch {
    // Ignore storage failures; the shell should remain usable without persistence.
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

function getCommandOptionId(prefix: string, itemId: string) {
  return `${prefix}-option-${itemId}`;
}

function getCommandLinkId(prefix: string, itemId: string) {
  return `${prefix}-link-${itemId}`;
}

function isCommandCategory(
  value: unknown,
): value is AppShellCommandCategory {
  return (
    value === "knowledge" ||
    value === "opportunity" ||
    value === "quick_create" ||
    value === "saved_search" ||
    value === "task" ||
    value === "view"
  );
}

function formatCommandCategoryLabel(category: AppShellCommandCategory) {
  switch (category) {
    case "quick_create":
      return "Quick create";
    case "saved_search":
      return "Saved search";
    default:
      return category.charAt(0).toUpperCase() + category.slice(1);
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

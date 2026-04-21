"use client";

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import OutlinedInput from "@mui/material/OutlinedInput";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useEffectEvent,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { hasAppPermission } from "@/lib/auth/permissions";
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
const SHELL_DARK_SURFACE_BG = "rgba(15,28,31,0.98)";
const SHELL_PANEL_BG = "rgba(255,255,255,0.05)";
const SHELL_PANEL_BORDER = "rgba(255,255,255,0.08)";
const SHELL_TEXT_PRIMARY = "#f5f5f4";
const SHELL_TEXT_SECONDARY = "rgba(245,245,244,0.78)";
const SHELL_TEXT_MUTED = "rgba(214,211,209,0.72)";
const SHELL_TEXT_FAINT = "rgba(168,162,158,0.74)";

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

  const handleKeyboardShortcut = useEffectEvent(
    (event: globalThis.KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        openCommandSurface();
      }
    },
  );

  useEffect(() => {
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

  function blurActiveShellElement() {
    const activeElement = document.activeElement;

    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
  }

  function openCommandSurface() {
    blurActiveShellElement();
    setIsCommandOpen(true);
  }

  function openMobileNavigation() {
    blurActiveShellElement();
    setIsMobileNavOpen(true);
  }

  function openNotificationsSurface() {
    blurActiveShellElement();
    setIsNotificationsOpen(true);
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
    <Box
      component="aside"
      sx={{
        bgcolor: SHELL_DARK_SURFACE_BG,
        borderRight: `1px solid ${SHELL_PANEL_BORDER}`,
        color: SHELL_TEXT_PRIMARY,
        display: {
          xs: "none",
          lg: "flex",
        },
        flexDirection: "column",
        flexShrink: 0,
        justifyContent: "space-between",
        px: isRailCollapsed ? 2 : 3,
        py: 3,
        width: isRailCollapsed ? 256 : 336,
      }}
    >
      <Stack spacing={2.5}>
        <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
          <Stack spacing={1.5}>
            <Box
              sx={{
                alignItems: "center",
                bgcolor: SHELL_PANEL_BG,
                border: `1px solid ${SHELL_PANEL_BORDER}`,
                borderRadius: 999,
                color: SHELL_TEXT_SECONDARY,
                display: "inline-flex",
                gap: 1.5,
                px: 2,
                py: 1,
                width: "fit-content",
              }}
            >
              <Box
                sx={{
                  bgcolor: "#dca167",
                  borderRadius: "999px",
                  height: 10,
                  width: 10,
                }}
              />
              <Typography sx={{ fontSize: "0.92rem", fontWeight: 500 }}>
                OneSource
              </Typography>
            </Box>
            {!isRailCollapsed ? (
              <Stack spacing={1}>
                <Typography
                  sx={{
                    color: SHELL_TEXT_PRIMARY,
                    fontFamily: "var(--font-heading), sans-serif",
                    fontSize: "1.95rem",
                    fontWeight: 600,
                    lineHeight: 1.12,
                  }}
                >
                  Capture command, discovery, and execution in one rail.
                </Typography>
                <Typography
                  sx={{
                    color: SHELL_TEXT_SECONDARY,
                    fontSize: "0.9rem",
                    lineHeight: 1.7,
                  }}
                >
                  Grouped navigation now feeds a command center with pinned work,
                  recent context, and alert review instead of leaving the shell as
                  a passive frame.
                </Typography>
              </Stack>
            ) : null}
          </Stack>
          <Button
            aria-label={
              isRailCollapsed
                ? "Expand navigation rail"
                : "Collapse navigation rail"
            }
            density="compact"
            onClick={() => updateCollapsedRailPreference(!isRailCollapsed)}
            sx={{
              alignSelf: "flex-start",
              borderColor: SHELL_PANEL_BORDER,
              color: SHELL_TEXT_PRIMARY,
              whiteSpace: "nowrap",
              "&:hover": {
                bgcolor: alpha("#ffffff", 0.08),
                borderColor: alpha("#ffffff", 0.2),
              },
            }}
            tone="neutral"
            type="button"
            variant="outlined"
          >
            {isRailCollapsed ? "Expand" : "Collapse"}
          </Button>
        </Stack>

        <Surface
          sx={{
            bgcolor: SHELL_PANEL_BG,
            borderColor: SHELL_PANEL_BORDER,
            boxShadow: "none",
            color: SHELL_TEXT_PRIMARY,
            p: 2.25,
          }}
        >
          <Typography sx={{ color: "inherit", fontSize: "0.96rem", fontWeight: 600 }}>
            {displayName}
          </Typography>
          <Typography
            sx={{ color: SHELL_TEXT_SECONDARY, fontSize: "0.88rem", mt: 0.75 }}
          >
            {sessionUser.email}
          </Typography>
          <Typography
            sx={{
              color: SHELL_TEXT_FAINT,
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              mt: 1.5,
              textTransform: "uppercase",
            }}
          >
            {roleSummary}
          </Typography>
        </Surface>

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
      </Stack>

      <Surface
        sx={{
          bgcolor: SHELL_PANEL_BG,
          borderColor: SHELL_PANEL_BORDER,
          boxShadow: "none",
          color: SHELL_TEXT_PRIMARY,
          mt: 3,
          p: 2.25,
        }}
      >
        <Typography
          sx={{
            color: SHELL_TEXT_FAINT,
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
          }}
        >
          Current focus
        </Typography>
        <Typography
          sx={{
            color: "inherit",
            fontFamily: "var(--font-heading), sans-serif",
            fontSize: "1.6rem",
            fontWeight: 600,
            mt: 1.75,
          }}
        >
          {activeDestination.label}
        </Typography>
        {!isRailCollapsed ? (
          <Typography
            sx={{ color: SHELL_TEXT_SECONDARY, fontSize: "0.92rem", lineHeight: 1.7, mt: 1.5 }}
          >
            {activeDestination.description}
          </Typography>
        ) : null}
      </Surface>
    </Box>
  );

  return (
    <Box
      sx={{
        background:
          "radial-gradient(circle at top left, rgba(32,95,85,0.12), transparent 28%), radial-gradient(circle at bottom right, rgba(168,93,42,0.1), transparent 24%)",
        display: "flex",
        minHeight: "100vh",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <Drawer
        description="Responsive grouped navigation now keeps quick links, pinned work, and recent work in the mobile shell instead of scattering them across individual routes."
        eyebrow="OneSource"
        onClose={() => setIsMobileNavOpen(false)}
        open={isMobileNavOpen}
        title="OneSource workspace"
      >
        <Surface
          sx={{
            bgcolor: SHELL_PANEL_BG,
            borderColor: SHELL_PANEL_BORDER,
            boxShadow: "none",
            color: SHELL_TEXT_PRIMARY,
            mt: 2.5,
            p: 2.25,
          }}
        >
          <Typography sx={{ color: "inherit", fontSize: "0.96rem", fontWeight: 600 }}>
            {displayName}
          </Typography>
          <Typography
            sx={{ color: SHELL_TEXT_SECONDARY, fontSize: "0.88rem", mt: 0.75 }}
          >
            {sessionUser.email}
          </Typography>
          <Typography
            sx={{
              color: SHELL_TEXT_FAINT,
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              mt: 1.5,
              textTransform: "uppercase",
            }}
          >
            {roleSummary}
          </Typography>
        </Surface>

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
          <Stack
            direction={{ sm: "row", xs: "column" }}
            spacing={1}
            sx={{ justifyContent: "space-between" }}
          >
            <Typography sx={{ color: "text.secondary", fontSize: "0.92rem" }}>
              Use ↑ and ↓ to move, then press Enter to open the selected result.
            </Typography>
            <Typography sx={{ color: "text.secondary", fontSize: "0.92rem" }}>
              {flatCommandItems.length} items available in the shell command center.
            </Typography>
          </Stack>
        }
        onClose={closeCommandSurface}
        open={isCommandOpen}
        title="Command center"
      >
        <Stack spacing={2}>
          <Box component="label" sx={{ display: "block" }}>
            <Box
              component="span"
              sx={{
                border: 0,
                clip: "rect(0 0 0 0)",
                height: 1,
                m: -1,
                overflow: "hidden",
                p: 0,
                position: "absolute",
                whiteSpace: "nowrap",
                width: 1,
              }}
            >
              Command search
            </Box>
            <OutlinedInput
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
              fullWidth
              inputRef={commandInputRef}
              onChange={(event) => setCommandQuery(event.target.value)}
              onKeyDown={handleCommandInputKeyDown}
              placeholder="Search workspaces, tasks, knowledge, or saved searches"
              sx={{
                bgcolor: alpha("#ffffff", 0.82),
                borderRadius: 3,
                boxShadow: "0 12px 28px rgba(20,37,34,0.06)",
                "& .MuiOutlinedInput-input": {
                  fontSize: "0.94rem",
                  py: 1.75,
                },
              }}
              type="search"
              value={commandQuery}
            />
          </Box>

          {flatCommandItems.length > 0 ? (
            <Stack
              aria-label="Command results"
              id={commandListboxId}
              role="listbox"
              spacing={2}
              sx={{ maxHeight: "28rem", overflowY: "auto", pr: 0.5 }}
            >
              {commandSections.map((section, sectionIndex) => (
                <Box component="section" key={section.key}>
                  {sectionIndex > 0 ? (
                    <Divider sx={{ borderColor: alpha("#122128", 0.08), mb: 2 }} />
                  ) : null}
                  <Typography
                    sx={{
                      color: "text.secondary",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      letterSpacing: "0.22em",
                      mb: 1.5,
                      textTransform: "uppercase",
                    }}
                  >
                    {section.label}
                  </Typography>
                  <Stack spacing={1.25}>
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
                        <Surface
                          aria-selected={resolvedActiveCommandItemId === item.id}
                          id={optionId}
                          key={item.id}
                          onMouseEnter={() => setActiveCommandItemId(item.id)}
                          role="option"
                          sx={{
                            bgcolor:
                              resolvedActiveCommandItemId === item.id
                                ? alpha("#1e5d66", 0.07)
                                : alpha("#ffffff", 0.72),
                            borderColor:
                              resolvedActiveCommandItemId === item.id
                                ? alpha("#1e5d66", 0.26)
                                : alpha("#122128", 0.08),
                            boxShadow:
                              resolvedActiveCommandItemId === item.id
                                ? "0 16px 36px rgba(20,37,34,0.12)"
                                : "0 10px 24px rgba(20,37,34,0.06)",
                            p: 1,
                          }}
                        >
                          <Stack direction="row" spacing={1}>
                            <Box
                              component={Link}
                              href={item.href}
                              id={getCommandLinkId(commandOptionIdPrefix, item.id)}
                              onClick={() => handleCommandItemSelection(workbenchItem)}
                              sx={{
                                borderRadius: 2.5,
                                color: "inherit",
                                display: "block",
                                flex: 1,
                                px: 1.5,
                                py: 1.5,
                                textDecoration: "none",
                                "&:focus-visible": {
                                  bgcolor: alpha("#1e5d66", 0.08),
                                  outline: "2px solid rgba(30,93,102,0.3)",
                                  outlineOffset: 2,
                                },
                                "&:hover": {
                                  bgcolor: alpha("#1e5d66", 0.05),
                                },
                              }}
                            >
                              <Stack spacing={0.75}>
                                <Stack
                                  direction="row"
                                  spacing={2}
                                  sx={{
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                  }}
                                >
                                  <Typography sx={{ fontSize: "0.94rem", fontWeight: 600 }}>
                                    {item.label}
                                  </Typography>
                                  <Typography
                                    sx={{
                                      color: "text.secondary",
                                      fontSize: "0.68rem",
                                      fontWeight: 700,
                                      letterSpacing: "0.18em",
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    {formatCommandCategoryLabel(item.category)}
                                  </Typography>
                                </Stack>
                                <Typography
                                  sx={{
                                    color: "text.secondary",
                                    fontSize: "0.88rem",
                                    lineHeight: 1.65,
                                  }}
                                >
                                  {item.description}
                                </Typography>
                                {item.supportingText ? (
                                  <Typography
                                    sx={{
                                      color: "text.secondary",
                                      fontSize: "0.68rem",
                                      fontWeight: 700,
                                      letterSpacing: "0.16em",
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    {item.supportingText}
                                  </Typography>
                                ) : null}
                              </Stack>
                            </Box>
                            <Button
                              aria-label={
                                isPinned
                                  ? `Remove ${item.label} from pinned work`
                                  : `Pin ${item.label} to pinned work`
                              }
                              density="compact"
                              onClick={() => togglePinnedItem(workbenchItem)}
                              sx={{
                                alignSelf: "flex-start",
                                minWidth: 92,
                              }}
                              tone="neutral"
                              type="button"
                              variant={isPinned ? "soft" : "outlined"}
                            >
                              {isPinned ? "Pinned" : "Pin"}
                            </Button>
                          </Stack>
                        </Surface>
                      );
                    })}
                  </Stack>
                </Box>
              ))}
            </Stack>
          ) : (
            <Surface
              sx={{
                bgcolor: alpha("#ffffff", 0.72),
                borderColor: alpha("#122128", 0.12),
                borderStyle: "dashed",
                p: 3,
              }}
            >
              <Typography
                sx={{ color: "text.secondary", fontSize: "0.92rem", lineHeight: 1.7 }}
              >
                No shell results match the current command query. Try a pursuit
                title, task name, knowledge asset, or saved search.
              </Typography>
            </Surface>
          )}
        </Stack>
      </Dialog>

      <Dialog
        description="Review high-signal reminders and connector issues without leaving the shell."
        onClose={() => setIsNotificationsOpen(false)}
        open={isNotificationsOpen}
        title="Notifications"
      >
        {shellSnapshot.notifications.items.length > 0 ? (
          <Stack spacing={1.5}>
            {shellSnapshot.notifications.items.map((notification) => (
              <Box
                component={Link}
                href={notification.href}
                key={notification.id}
                onClick={() => setIsNotificationsOpen(false)}
                sx={{
                  bgcolor: alpha("#ffffff", 0.84),
                  border: "1px solid",
                  borderColor: alpha("#122128", 0.08),
                  borderRadius: 3,
                  color: "inherit",
                  display: "block",
                  px: 2.5,
                  py: 2,
                  textDecoration: "none",
                  transition: "background-color 140ms ease, border-color 140ms ease",
                  "&:hover": {
                    bgcolor: alpha("#1e5d66", 0.04),
                    borderColor: alpha("#1e5d66", 0.22),
                  },
                }}
              >
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography sx={{ fontSize: "0.94rem", fontWeight: 600 }}>
                    {notification.title}
                  </Typography>
                  <Badge tone={getNotificationBadgeTone(notification.tone)}>
                    {notification.tone}
                  </Badge>
                </Stack>
                <Typography
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.88rem",
                    lineHeight: 1.65,
                    mt: 1,
                  }}
                >
                  {notification.summary}
                </Typography>
                {notification.timestamp ? (
                  <Typography
                    sx={{
                      color: "text.secondary",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      letterSpacing: "0.16em",
                      mt: 1.5,
                      textTransform: "uppercase",
                    }}
                  >
                    {formatDateTime(notification.timestamp)}
                  </Typography>
                ) : null}
              </Box>
            ))}
          </Stack>
        ) : (
          <Surface
            sx={{
              bgcolor: alpha("#ffffff", 0.72),
              borderColor: alpha("#122128", 0.12),
              borderStyle: "dashed",
              p: 3,
            }}
          >
            <Typography
              sx={{ color: "text.secondary", fontSize: "0.92rem", lineHeight: 1.7 }}
            >
              No active alerts are queued in the shell right now. Overdue tasks,
              upcoming reminders, and saved-search issues will appear here.
            </Typography>
          </Surface>
        )}
      </Dialog>

      {desktopShell}

      <Box sx={{ display: "flex", flex: 1, flexDirection: "column", minWidth: 0 }}>
        <Box
          component="header"
          sx={{
            backdropFilter: "blur(18px)",
            backgroundColor: "rgba(247,243,232,0.88)",
            borderBottom: "1px solid rgba(18,33,40,0.12)",
            position: "sticky",
            px: { lg: 4, sm: 3, xs: 2 },
            py: 2,
            top: 0,
            zIndex: 20,
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, marginX: "auto", maxWidth: 1280, minWidth: 0 }}>
            <Stack
              direction="row"
              spacing={2}
              sx={{
                alignItems: "center",
                display: { lg: "none" },
                justifyContent: "space-between",
              }}
            >
              <Stack direction="row" spacing={1.5}>
                <Button
                  aria-controls="mobile-navigation"
                  aria-expanded={isMobileNavOpen}
                  aria-label="Open navigation menu"
                  density="compact"
                  onClick={openMobileNavigation}
                  sx={{ minWidth: 0, px: 1.75 }}
                  tone="neutral"
                  type="button"
                  variant="outlined"
                >
                  Menu
                </Button>
                <Box>
                  <Typography
                    sx={{
                      color: "text.secondary",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      letterSpacing: "0.24em",
                      textTransform: "uppercase",
                    }}
                  >
                    {activeGroup.title}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "var(--font-heading), sans-serif",
                      fontSize: "1.25rem",
                      fontWeight: 600,
                    }}
                  >
                    {activeDestination.label}
                  </Typography>
                </Box>
              </Stack>
              <Box sx={{ display: { sm: "none" } }}>
                <SignOutButton />
              </Box>
            </Stack>

            <Stack
              direction={{ xl: "row", xs: "column" }}
              spacing={3}
              sx={{ justifyContent: "space-between" }}
            >
              <Stack spacing={1}>
                <Typography
                  sx={{
                    color: "text.secondary",
                    display: { lg: "block", xs: "none" },
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    letterSpacing: "0.24em",
                    textTransform: "uppercase",
                  }}
                >
                  {activeGroup.title}
                </Typography>
                <Typography
                  sx={{
                    display: { lg: "block", xs: "none" },
                    fontFamily: "var(--font-heading), sans-serif",
                    fontSize: "2rem",
                    fontWeight: 600,
                    letterSpacing: "-0.04em",
                  }}
                >
                  {activeDestination.label}
                </Typography>
                <Typography
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.92rem",
                    lineHeight: 1.7,
                    maxWidth: 720,
                  }}
                >
                  {activeDestination.description}
                </Typography>
              </Stack>

              <Stack spacing={1.5} sx={{ minWidth: { xl: 672 } }}>
                <Stack
                  direction={{ sm: "row", xs: "column" }}
                  spacing={1.5}
                  sx={{ justifyContent: { xl: "flex-end" } }}
                >
                  <Button
                    aria-expanded={isCommandOpen}
                    aria-haspopup="dialog"
                    aria-label="Open command search"
                    onClick={openCommandSurface}
                    sx={{
                      bgcolor: "background.paper",
                      borderColor: "divider",
                      borderRadius: 999,
                      boxShadow: "0 12px 28px rgba(20,37,34,0.06)",
                      justifyContent: "space-between",
                      px: 2,
                      py: 1.5,
                      width: "100%",
                      "&:hover": {
                        borderColor: alpha("#1e5d66", 0.24),
                      },
                    }}
                    tone="neutral"
                    type="button"
                    variant="outlined"
                  >
                    <Stack
                      direction="row"
                      spacing={1.5}
                      sx={{
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                      }}
                    >
                      <Typography sx={{ color: "text.secondary", fontSize: "0.9rem" }}>
                        Search work, tasks, knowledge, or saved searches
                      </Typography>
                      <Badge tone="muted">Cmd K</Badge>
                    </Stack>
                  </Button>
                  <Button
                    aria-expanded={isNotificationsOpen}
                    aria-haspopup="dialog"
                    aria-label="Open notifications"
                    onClick={openNotificationsSurface}
                    sx={{
                      boxShadow: "0 12px 28px rgba(20,37,34,0.06)",
                      whiteSpace: "nowrap",
                    }}
                    tone="neutral"
                    type="button"
                    variant="outlined"
                  >
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <Typography
                        component="span"
                        sx={{ fontSize: "0.92rem", fontWeight: 600 }}
                      >
                        Alerts
                      </Typography>
                      <Badge tone={notificationCount > 0 ? "accent" : "muted"}>
                        {notificationCount}
                      </Badge>
                    </Stack>
                  </Button>
                </Stack>
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{
                    alignItems: "center",
                    justifyContent: { sm: "flex-end", xs: "space-between" },
                  }}
                >
                  <Box sx={{ textAlign: "right" }}>
                    <Typography sx={{ fontSize: "0.92rem", fontWeight: 600 }}>
                      {displayName}
                    </Typography>
                    <Typography sx={{ color: "text.secondary", fontSize: "0.76rem" }}>
                      {sessionUser.email}
                    </Typography>
                  </Box>
                  <Box sx={{ display: { sm: "block", xs: "none" } }}>
                    <SignOutButton />
                  </Box>
                </Stack>
              </Stack>
            </Stack>
          </Box>
        </Box>

        <Box component="main" sx={{ flex: 1, minWidth: 0, px: { lg: 4, sm: 3, xs: 2 }, py: 3 }}>
          <Box sx={{ marginX: "auto", maxWidth: 1280, minWidth: 0 }}>{children}</Box>
        </Box>
      </Box>
    </Box>
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
    <Stack
      component="nav"
      aria-label={title}
      id={title === "Mobile navigation" ? "mobile-navigation" : undefined}
      spacing={2.5}
    >
      {groups.map((group) => (
        <Box component="section" key={group.title}>
          <Box>
            <Typography
              sx={{
                color: SHELL_TEXT_FAINT,
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
              }}
            >
              {group.title}
            </Typography>
            {!collapsed ? (
              <Typography
                sx={{
                  color: SHELL_TEXT_MUTED,
                  fontSize: "0.76rem",
                  lineHeight: 1.6,
                  mt: 0.5,
                }}
              >
                {group.description}
              </Typography>
            ) : null}
          </Box>
          <Stack spacing={1.25} sx={{ mt: 1.25 }}>
            {group.items.map((item) => {
              const active = isRouteActive(item.href, currentPath);

              return (
                <Box
                  component={Link}
                  key={item.href}
                  aria-current={active ? "page" : undefined}
                  href={item.href}
                  onClick={() => {
                    onNavigate?.();
                    onRememberItem?.(createWorkbenchItemFromNavItem(item));
                  }}
                  sx={{
                    bgcolor: active ? alpha("#ffffff", 0.08) : "transparent",
                    border: "1px solid",
                    borderColor: active ? alpha("#ffffff", 0.16) : "transparent",
                    borderRadius: 2.5,
                    boxShadow: active
                      ? "0 12px 30px rgba(15,28,31,0.18)"
                      : "none",
                    color: active ? SHELL_TEXT_PRIMARY : SHELL_TEXT_SECONDARY,
                    display: "block",
                    px: 2,
                    py: 1.5,
                    textDecoration: "none",
                    transition:
                      "background-color 140ms ease, border-color 140ms ease, color 140ms ease",
                    "&:hover": {
                      bgcolor: alpha("#ffffff", 0.06),
                      borderColor: alpha("#ffffff", 0.1),
                      color: SHELL_TEXT_PRIMARY,
                    },
                  }}
                >
                  <Typography sx={{ color: "inherit", fontSize: "0.92rem", fontWeight: 600 }}>
                    {item.label}
                  </Typography>
                  {!collapsed ? (
                    <Typography
                      sx={{
                        color: active ? SHELL_TEXT_SECONDARY : SHELL_TEXT_MUTED,
                        display: "block",
                        fontSize: "0.76rem",
                        lineHeight: 1.6,
                        mt: 0.5,
                      }}
                    >
                      {item.description}
                    </Typography>
                  ) : null}
                </Box>
              );
            })}
          </Stack>
        </Box>
      ))}
    </Stack>
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
    <Surface
      component="section"
      sx={{
        bgcolor: SHELL_PANEL_BG,
        borderColor: SHELL_PANEL_BORDER,
        boxShadow: "none",
        color: SHELL_TEXT_PRIMARY,
        mt: mobile ? 2.5 : 0,
        p: 2.25,
      }}
    >
      <Typography
        sx={{
          color: SHELL_TEXT_FAINT,
          fontSize: "0.72rem",
          fontWeight: 700,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
        }}
      >
        Quick links
      </Typography>
      {!collapsed ? (
        <Typography
          sx={{ color: SHELL_TEXT_MUTED, fontSize: "0.76rem", lineHeight: 1.6, mt: 0.5 }}
        >
          Frequent jumps that stay attached to the shell.
        </Typography>
      ) : null}
      <Stack spacing={1.25} sx={{ mt: 1.5 }}>
        {links.map((link) => {
          const active = isRouteActive(link.href, currentPath);

          return (
            <Box
              component={Link}
              key={link.href}
              aria-current={active ? "page" : undefined}
              href={link.href}
              onClick={() => onRememberItem?.(createWorkbenchItemFromNavItem(link))}
              sx={{
                bgcolor: active ? alpha("#ffffff", 0.08) : "transparent",
                border: "1px solid",
                borderColor: active ? alpha("#ffffff", 0.16) : "transparent",
                borderRadius: 2.25,
                color: active ? SHELL_TEXT_PRIMARY : SHELL_TEXT_SECONDARY,
                display: "block",
                px: 1.75,
                py: 1.5,
                textDecoration: "none",
                "&:hover": {
                  bgcolor: alpha("#ffffff", 0.06),
                  borderColor: alpha("#ffffff", 0.1),
                  color: SHELL_TEXT_PRIMARY,
                },
              }}
            >
              <Typography sx={{ color: "inherit", fontSize: "0.9rem", fontWeight: 600 }}>
                {link.label}
              </Typography>
              {!collapsed ? (
                <Typography
                  sx={{
                    color: active ? SHELL_TEXT_SECONDARY : SHELL_TEXT_MUTED,
                    display: "block",
                    fontSize: "0.76rem",
                    lineHeight: 1.6,
                    mt: 0.5,
                  }}
                >
                  {link.description}
                </Typography>
              ) : null}
            </Box>
          );
        })}
      </Stack>
    </Surface>
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
    <Surface
      component="section"
      sx={{
        bgcolor: SHELL_PANEL_BG,
        borderColor: SHELL_PANEL_BORDER,
        boxShadow: "none",
        color: SHELL_TEXT_PRIMARY,
        mt: mobile ? 2.5 : 0,
        p: 2.25,
      }}
    >
      <Typography
        sx={{
          color: SHELL_TEXT_FAINT,
          fontSize: "0.72rem",
          fontWeight: 700,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
        }}
      >
        Pinned work
      </Typography>
      {!collapsed ? (
        <Typography
          sx={{ color: SHELL_TEXT_MUTED, fontSize: "0.76rem", lineHeight: 1.6, mt: 0.5 }}
        >
          Keep recurring pursuits, saved views, and quick return points visible in
          the shell.
        </Typography>
      ) : null}

      {items.length > 0 ? (
        <Stack spacing={1.25} sx={{ mt: 1.5 }}>
          {items.map((item) => (
            <Box
              key={item.href}
              sx={{
                border: "1px solid transparent",
                borderRadius: 2.25,
                px: 1.75,
                py: 1.5,
                transition: "background-color 140ms ease, border-color 140ms ease",
                "&:hover": {
                  bgcolor: alpha("#ffffff", 0.04),
                  borderColor: alpha("#ffffff", 0.08),
                },
              }}
            >
              <Stack direction="row" spacing={1}>
                <Box
                  component={Link}
                  href={item.href}
                  onClick={() => {
                    onNavigate?.();
                    onRememberItem?.(item);
                  }}
                  sx={{
                    color: SHELL_TEXT_SECONDARY,
                    flex: 1,
                    textDecoration: "none",
                    "&:hover": {
                      color: SHELL_TEXT_PRIMARY,
                    },
                  }}
                >
                  <Typography sx={{ color: "inherit", fontSize: "0.9rem", fontWeight: 600 }}>
                    {item.label}
                  </Typography>
                  {!collapsed ? (
                    <Box>
                      <Typography
                        sx={{
                          color: SHELL_TEXT_MUTED,
                          display: "block",
                          fontSize: "0.76rem",
                          lineHeight: 1.6,
                          mt: 0.5,
                        }}
                      >
                        {item.description}
                      </Typography>
                      {item.supportingText ? (
                        <Typography
                          sx={{
                            color: SHELL_TEXT_FAINT,
                            display: "block",
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            letterSpacing: "0.16em",
                            mt: 1,
                            textTransform: "uppercase",
                          }}
                        >
                          {item.supportingText}
                        </Typography>
                      ) : null}
                    </Box>
                  ) : null}
                </Box>
                <Button
                  aria-label={`Remove ${item.label} from pinned work`}
                  density="compact"
                  onClick={() => onTogglePinnedItem(item)}
                  sx={{
                    alignSelf: "flex-start",
                    borderColor: SHELL_PANEL_BORDER,
                    color: SHELL_TEXT_SECONDARY,
                    minWidth: 0,
                    px: 1.25,
                    "&:hover": {
                      bgcolor: alpha("#ffffff", 0.08),
                      borderColor: alpha("#ffffff", 0.18),
                      color: SHELL_TEXT_PRIMARY,
                    },
                  }}
                  tone="neutral"
                  type="button"
                  variant="outlined"
                >
                  Remove
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      ) : (
        <Typography
          sx={{ color: SHELL_TEXT_MUTED, fontSize: "0.88rem", lineHeight: 1.7, mt: 1.5 }}
        >
          Pin a pursuit or view from the command center and it will stay visible
          here.
        </Typography>
      )}
    </Surface>
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
    <Surface
      component="section"
      sx={{
        bgcolor: SHELL_PANEL_BG,
        borderColor: SHELL_PANEL_BORDER,
        boxShadow: "none",
        color: SHELL_TEXT_PRIMARY,
        mt: mobile ? 2.5 : 0,
        p: 2.25,
      }}
    >
      <Typography
        sx={{
          color: SHELL_TEXT_FAINT,
          fontSize: "0.72rem",
          fontWeight: 700,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
        }}
      >
        Recent work
      </Typography>
      {!collapsed ? (
        <Typography
          sx={{ color: SHELL_TEXT_MUTED, fontSize: "0.76rem", lineHeight: 1.6, mt: 0.5 }}
        >
          Resume the most recent shell views, pursuits, and quick-return items.
        </Typography>
      ) : null}

      {items.length > 0 ? (
        <Stack spacing={1.25} sx={{ mt: 1.5 }}>
          {items.map((item) => (
            <Box
              component={Link}
              key={item.href}
              href={item.href}
              onClick={() => {
                onNavigate?.();
                onRememberItem?.(item);
              }}
              sx={{
                border: "1px solid transparent",
                borderRadius: 2.25,
                color: SHELL_TEXT_SECONDARY,
                display: "block",
                px: 1.75,
                py: 1.5,
                textDecoration: "none",
                transition: "background-color 140ms ease, border-color 140ms ease",
                "&:hover": {
                  bgcolor: alpha("#ffffff", 0.04),
                  borderColor: alpha("#ffffff", 0.08),
                  color: SHELL_TEXT_PRIMARY,
                },
              }}
            >
              <Typography sx={{ color: "inherit", fontSize: "0.9rem", fontWeight: 600 }}>
                {item.label}
              </Typography>
              {!collapsed ? (
                <Box>
                  <Typography
                    sx={{
                      color: SHELL_TEXT_MUTED,
                      display: "block",
                      fontSize: "0.76rem",
                      lineHeight: 1.6,
                      mt: 0.5,
                    }}
                  >
                    {item.description}
                  </Typography>
                  {item.supportingText ? (
                    <Typography
                      sx={{
                        color: SHELL_TEXT_FAINT,
                        display: "block",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        letterSpacing: "0.16em",
                        mt: 1,
                        textTransform: "uppercase",
                      }}
                    >
                      {item.supportingText}
                    </Typography>
                  ) : null}
                </Box>
              ) : null}
            </Box>
          ))}
        </Stack>
      ) : (
        <Typography
          sx={{ color: SHELL_TEXT_MUTED, fontSize: "0.88rem", lineHeight: 1.7, mt: 1.5 }}
        >
          Open a route or jump to work from the command center and it will appear
          here for quick return.
        </Typography>
      )}
    </Surface>
  );
}

function getNotificationBadgeTone(
  tone: "accent" | "danger" | "warning",
): "accent" | "danger" | "warning" {
  return tone;
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

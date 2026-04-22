"use client";

import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";
import PushPinRoundedIcon from "@mui/icons-material/PushPinRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import SpaceDashboardRoundedIcon from "@mui/icons-material/SpaceDashboardRounded";
import TravelExploreRoundedIcon from "@mui/icons-material/TravelExploreRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import MuiDrawer from "@mui/material/Drawer";
import OutlinedInput from "@mui/material/OutlinedInput";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
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
import { onesourceTokens } from "@/theme/onesource-theme";

const SHELL_COLLAPSE_STORAGE_KEY = "onesource.shell.is-collapsed";
const SHELL_PINNED_ITEMS_STORAGE_KEY = "onesource.shell.pinned-items";
const SHELL_PREFERENCES_EVENT = "onesource.shell.preferences-changed";
const SHELL_RECENT_DESTINATIONS_STORAGE_KEY =
  "onesource.shell.recent-destinations";
const SHELL_PINNED_ITEM_LIMIT = 6;
const SHELL_RECENT_DESTINATION_LIMIT = 4;
const SHELL_DARK_SURFACE_BG = onesourceTokens.shell.background;
const SHELL_PANEL_BG = onesourceTokens.shell.panel;
const SHELL_PANEL_BORDER = onesourceTokens.shell.panelBorder;
const SHELL_TEXT_PRIMARY = onesourceTokens.shell.textPrimary;
const SHELL_TEXT_SECONDARY = onesourceTokens.shell.textSecondary;
const SHELL_TEXT_MUTED = onesourceTokens.shell.textMuted;
const SHELL_TEXT_FAINT = onesourceTokens.shell.textFaint;

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

type WorkbenchView = "pinned" | "recent";

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
  const [desktopWorkbenchView, setDesktopWorkbenchView] =
    useState<WorkbenchView>("pinned");
  const [mobileWorkbenchView, setMobileWorkbenchView] =
    useState<WorkbenchView>("pinned");
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
  const workspaceIdentity = formatWorkspaceIdentity(sessionUser.organizationId);

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

  const railWidth = isRailCollapsed
    ? onesourceTokens.sizing.railCollapsed
    : onesourceTokens.sizing.railExpanded;
  const userInitials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "OS";
  const desktopShell = (
    <MuiDrawer
      open
      variant="permanent"
      sx={{
        color: SHELL_TEXT_PRIMARY,
        display: {
          xs: "none",
          lg: "block",
        },
        flexShrink: 0,
        width: railWidth,
        zIndex: 25,
        "& .MuiDrawer-paper": {
          backgroundColor: SHELL_DARK_SURFACE_BG,
          borderRight: `1px solid ${SHELL_PANEL_BORDER}`,
          boxSizing: "border-box",
          color: SHELL_TEXT_PRIMARY,
          overflowX: "hidden",
          overflowY: "hidden",
          px: isRailCollapsed ? 1.5 : 2.5,
          py: 2.5,
          scrollbarWidth: "none",
          top: 0,
          transition:
            "width 180ms ease, padding-inline 180ms ease, background-color 180ms ease",
          width: railWidth,
          "&::-webkit-scrollbar": {
            display: "none",
          },
        },
      }}
    >
      <Stack sx={{ height: "100%", minHeight: 0 }}>
        <Stack spacing={2.5} sx={{ flex: 1, minHeight: 0 }}>
          <Stack
            direction={isRailCollapsed ? "column" : "row"}
            spacing={isRailCollapsed ? 1.5 : 2}
            sx={{
              alignItems: isRailCollapsed ? "center" : "flex-start",
              justifyContent: "space-between",
            }}
          >
            <Stack
              spacing={1.25}
              sx={{
                alignItems: isRailCollapsed ? "center" : "flex-start",
                flex: isRailCollapsed ? "0 0 auto" : "1 1 auto",
                minWidth: 0,
              }}
            >
              <Tooltip
                disableHoverListener={!isRailCollapsed}
                placement="right"
                title="OneSource workspace"
              >
                <Box
                  sx={{
                    alignItems: "center",
                    bgcolor: SHELL_PANEL_BG,
                    border: `1px solid ${SHELL_PANEL_BORDER}`,
                    borderRadius: 999,
                    color: SHELL_TEXT_SECONDARY,
                    display: "inline-flex",
                    gap: 1.25,
                    px: isRailCollapsed ? 1.25 : 1.75,
                    py: 0.9,
                    width: "fit-content",
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: onesourceTokens.shell.brandAccent,
                      borderRadius: "999px",
                      height: 10,
                      width: 10,
                    }}
                  />
                  {!isRailCollapsed ? (
                    <Typography sx={{ fontSize: "0.9rem", fontWeight: 600 }}>
                      OneSource
                    </Typography>
                  ) : null}
                </Box>
              </Tooltip>
              {!isRailCollapsed ? (
                <Stack spacing={0.5}>
                  <Typography
                    sx={{
                      color: SHELL_TEXT_FAINT,
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                    }}
                  >
                    Workspace
                  </Typography>
                  <Typography
                    sx={{
                      color: SHELL_TEXT_PRIMARY,
                      fontFamily: "var(--font-heading), sans-serif",
                      fontSize: "1.35rem",
                      fontWeight: 600,
                      lineHeight: 1.15,
                      maxWidth: "100%",
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {workspaceIdentity.label}
                  </Typography>
                  {workspaceIdentity.supportingText ? (
                    <Typography
                      sx={{
                        color: SHELL_TEXT_SECONDARY,
                        fontSize: "0.72rem",
                        lineHeight: 1.4,
                        mt: 0.45,
                      }}
                    >
                      {workspaceIdentity.supportingText}
                    </Typography>
                  ) : null}
                </Stack>
              ) : null}
            </Stack>
            <Tooltip
              placement={isRailCollapsed ? "right" : "bottom"}
              title={
                isRailCollapsed
                  ? "Expand navigation rail"
                  : "Collapse navigation rail"
              }
            >
              <IconButton
                aria-label={
                  isRailCollapsed
                    ? "Expand navigation rail"
                    : "Collapse navigation rail"
                }
                onClick={() => updateCollapsedRailPreference(!isRailCollapsed)}
                sx={{
                  alignSelf: isRailCollapsed ? "center" : "flex-start",
                  bgcolor: alpha("#ffffff", 0.1),
                  border: `1px solid ${alpha("#ffffff", 0.16)}`,
                  borderRadius: 2.75,
                  boxShadow: "0 12px 24px rgba(4, 12, 14, 0.22)",
                  color: SHELL_TEXT_PRIMARY,
                  flexShrink: 0,
                  "&:hover": {
                    bgcolor: alpha("#ffffff", 0.16),
                    borderColor: alpha("#ffffff", 0.24),
                  },
                }}
              >
                {isRailCollapsed ? (
                  <ChevronRightRoundedIcon fontSize="small" />
                ) : (
                  <ChevronLeftRoundedIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Stack>

          <Surface
            sx={{
              bgcolor: SHELL_PANEL_BG,
              borderColor: SHELL_PANEL_BORDER,
              boxShadow: "none",
              color: SHELL_TEXT_PRIMARY,
              borderRadius: 3,
              p: isRailCollapsed ? 1 : 1.25,
            }}
          >
            <Stack
              direction={isRailCollapsed ? "column" : "row"}
              spacing={isRailCollapsed ? 0.7 : 1}
              sx={{ alignItems: "center" }}
            >
              <Box
                sx={{
                  alignItems: "center",
                  bgcolor: alpha(onesourceTokens.shell.brandAccent, 0.18),
                  border: "1px solid",
                  borderColor: alpha(onesourceTokens.shell.brandAccent, 0.34),
                  borderRadius: 999,
                  color: "#f3c79b",
                  display: "inline-flex",
                  flexShrink: 0,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  justifyContent: "center",
                  lineHeight: 1,
                  minHeight: 32,
                  minWidth: 32,
                  px: isRailCollapsed ? 0 : 1,
                  py: isRailCollapsed ? 0 : 0.65,
                }}
              >
                {userInitials}
              </Box>
              {!isRailCollapsed ? (
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{ color: "inherit", fontSize: "0.84rem", fontWeight: 600 }}
                  >
                    {displayName}
                  </Typography>
                  <Typography
                    sx={{
                      color: SHELL_TEXT_SECONDARY,
                      fontSize: "0.75rem",
                      mt: 0.2,
                    }}
                  >
                    {sessionUser.email}
                  </Typography>
                  <Typography
                    sx={{
                      color: SHELL_TEXT_FAINT,
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      mt: 0.8,
                      textTransform: "uppercase",
                    }}
                  >
                    {roleSummary}
                  </Typography>
                </Box>
              ) : null}
            </Stack>
          </Surface>

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              pr: 0.25,
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": {
                display: "none",
              },
            }}
          >
            <NavigationMenu
              collapsed={isRailCollapsed}
              currentPath={currentPath}
              groups={navGroups}
              onRememberItem={rememberRecentItem}
              title="Primary navigation"
            />
          </Box>
        </Stack>

        {!isRailCollapsed ? (
          <WorkbenchPanel
            items={{
              pinned: pinnedItems,
              recent: visibleRecentItems,
            }}
            onRememberItem={rememberRecentItem}
            onTogglePinnedItem={togglePinnedItem}
            onViewChange={setDesktopWorkbenchView}
            view={desktopWorkbenchView}
          />
        ) : null}
      </Stack>
    </MuiDrawer>
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
        anchor="left"
        description="Responsive grouped navigation keeps the shell navigation primary while the mobile workbench holds pinned and recent destinations."
        eyebrow="OneSource"
        hideAbove="lg"
        onClose={() => setIsMobileNavOpen(false)}
        open={isMobileNavOpen}
        title="OneSource workspace"
        width={336}
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
        <WorkbenchPanel
          items={{
            pinned: pinnedItems,
            recent: visibleRecentItems,
          }}
          mobile
          onNavigate={() => setIsMobileNavOpen(false)}
          onRememberItem={rememberRecentItem}
          onTogglePinnedItem={togglePinnedItem}
          onViewChange={setMobileWorkbenchView}
          view={mobileWorkbenchView}
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
      spacing={collapsed ? 1.5 : 2.25}
    >
      {groups.map((group) => (
        <Box component="section" key={group.title}>
          {!collapsed ? (
            <Box sx={{ px: 0.75 }}>
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
              <Typography
                sx={{
                  color: SHELL_TEXT_SECONDARY,
                  fontSize: "0.76rem",
                  lineHeight: 1.6,
                  mt: 0.5,
                }}
              >
                {group.description}
              </Typography>
            </Box>
          ) : null}
          <List disablePadding sx={{ mt: collapsed ? 0 : 1.25 }}>
            {group.items.map((item) => {
              const active = isRouteActive(item.href, currentPath);
              const navButton = (
                <ListItemButton
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                  component={Link}
                  href={item.href}
                  key={item.href}
                  onClick={() => {
                    onNavigate?.();
                    onRememberItem?.(createWorkbenchItemFromNavItem(item));
                  }}
                  selected={active}
                  sx={{
                    alignItems: collapsed ? "center" : "flex-start",
                    border: "1px solid",
                    borderColor: active
                      ? onesourceTokens.shell.activeBorder
                      : "transparent",
                    borderRadius: 2.5,
                    boxShadow: active
                      ? "0 12px 30px rgba(15,28,31,0.18)"
                      : "none",
                    color: active ? SHELL_TEXT_PRIMARY : SHELL_TEXT_SECONDARY,
                    justifyContent: collapsed ? "center" : "flex-start",
                    mb: 0.75,
                    minHeight: collapsed ? 52 : 64,
                    px: collapsed ? 1 : 1.5,
                    py: collapsed ? 1 : 1.15,
                    "&.Mui-selected": {
                      backgroundColor: onesourceTokens.shell.activeItem,
                    },
                    "&.Mui-selected:hover": {
                      backgroundColor: alpha(onesourceTokens.shell.activeItem, 0.96),
                    },
                    "&:hover": {
                      backgroundColor: onesourceTokens.shell.hoverOverlay,
                      borderColor: alpha("#ffffff", 0.1),
                      color: SHELL_TEXT_PRIMARY,
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: "inherit",
                      justifyContent: "center",
                      minWidth: collapsed ? 0 : 38,
                      mt: collapsed ? 0 : 0.2,
                    }}
                  >
                    {getNavItemIcon(item.href)}
                  </ListItemIcon>
                  {!collapsed ? (
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: "0.92rem",
                          fontWeight: 600,
                          lineHeight: 1.35,
                        }}
                      >
                        {item.label}
                      </Typography>
                      <Typography
                        sx={{
                          color: SHELL_TEXT_SECONDARY,
                          fontSize: "0.74rem",
                          lineHeight: 1.55,
                          mt: 0.45,
                        }}
                      >
                        {item.description}
                      </Typography>
                    </Box>
                  ) : null}
                </ListItemButton>
              );

              return collapsed ? (
                <Tooltip key={item.href} placement="right" title={item.label}>
                  {navButton}
                </Tooltip>
              ) : (
                navButton
              );
            })}
          </List>
        </Box>
      ))}
    </Stack>
  );
}

function WorkbenchPanel({
  items,
  mobile = false,
  onNavigate,
  onRememberItem,
  onTogglePinnedItem,
  onViewChange,
  view,
}: {
  items: {
    pinned: AppShellWorkbenchItem[];
    recent: AppShellWorkbenchItem[];
  };
  mobile?: boolean;
  onNavigate?: () => void;
  onRememberItem?: (item: AppShellWorkbenchItem) => void;
  onTogglePinnedItem: (item: AppShellWorkbenchItem) => void;
  onViewChange: (view: WorkbenchView) => void;
  view: WorkbenchView;
}) {
  const visibleItems =
    view === "pinned" ? items.pinned.slice(0, 4) : items.recent.slice(0, 4);
  const isPinnedView = view === "pinned";

  return (
    <Surface
      aria-label="Workbench"
      component="section"
      sx={{
        bgcolor: SHELL_PANEL_BG,
        borderColor: SHELL_PANEL_BORDER,
        boxShadow: "none",
        color: SHELL_TEXT_PRIMARY,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        maxHeight: mobile ? "none" : 292,
        mt: mobile ? 2.5 : 0,
        overflow: "hidden",
        p: mobile ? 2 : 1.75,
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", justifyContent: "space-between" }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: SHELL_TEXT_FAINT,
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
            }}
          >
            Workbench
          </Typography>
          <Typography
            sx={{
              color: SHELL_TEXT_MUTED,
              fontSize: "0.74rem",
              lineHeight: 1.5,
              mt: 0.35,
            }}
          >
            Keep return points close without turning the rail into a second dashboard.
          </Typography>
        </Box>
        <Badge tone="muted">{visibleItems.length} visible</Badge>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
        <Button
          aria-pressed={isPinnedView}
          density="compact"
          onClick={() => onViewChange("pinned")}
          sx={{
            flex: 1,
            borderColor: alpha("#ffffff", isPinnedView ? 0.18 : 0.14),
            bgcolor: isPinnedView ? alpha("#ffffff", 0.14) : "transparent",
            color: isPinnedView ? SHELL_TEXT_PRIMARY : SHELL_TEXT_SECONDARY,
            "&:hover": {
              bgcolor: alpha("#ffffff", isPinnedView ? 0.18 : 0.08),
              borderColor: alpha("#ffffff", 0.2),
              color: SHELL_TEXT_PRIMARY,
            },
          }}
          tone="neutral"
          type="button"
          variant={isPinnedView ? "soft" : "outlined"}
        >
          Pinned
        </Button>
        <Button
          aria-pressed={!isPinnedView}
          density="compact"
          onClick={() => onViewChange("recent")}
          sx={{
            flex: 1,
            borderColor: alpha("#ffffff", !isPinnedView ? 0.18 : 0.14),
            bgcolor: !isPinnedView ? alpha("#ffffff", 0.14) : "transparent",
            color: !isPinnedView ? SHELL_TEXT_PRIMARY : SHELL_TEXT_SECONDARY,
            "&:hover": {
              bgcolor: alpha("#ffffff", !isPinnedView ? 0.18 : 0.08),
              borderColor: alpha("#ffffff", 0.2),
              color: SHELL_TEXT_PRIMARY,
            },
          }}
          tone="neutral"
          type="button"
          variant={!isPinnedView ? "soft" : "outlined"}
        >
          Recent
        </Button>
      </Stack>

      {visibleItems.length > 0 ? (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            mt: 1.5,
            overflowY: "auto",
            pr: 0.25,
            scrollbarWidth: "thin",
          }}
        >
          <List disablePadding>
            {visibleItems.map((item) => (
              <Box
                key={item.href}
                sx={{
                  border: "1px solid transparent",
                  borderRadius: 2.25,
                  color: SHELL_TEXT_SECONDARY,
                  mb: 0.75,
                  transition: "background-color 140ms ease, border-color 140ms ease",
                  "&:hover": {
                    bgcolor: alpha("#ffffff", 0.04),
                    borderColor: alpha("#ffffff", 0.08),
                  },
                }}
              >
                <Stack direction="row" spacing={0.75} sx={{ alignItems: "flex-start" }}>
                  <ListItemButton
                    aria-label={item.label}
                    component={Link}
                    href={item.href}
                    onClick={() => {
                      onNavigate?.();
                      onRememberItem?.(item);
                    }}
                    sx={{
                      borderRadius: 2,
                      color: SHELL_TEXT_SECONDARY,
                      flex: 1,
                      minHeight: 54,
                      minWidth: 0,
                      px: 1.1,
                      py: 0.95,
                      "&:hover": {
                        backgroundColor: "transparent",
                        color: SHELL_TEXT_PRIMARY,
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: "inherit",
                        justifyContent: "center",
                        minWidth: 34,
                        mt: 0.1,
                      }}
                    >
                      {getWorkbenchItemIcon(item, isPinnedView)}
                    </ListItemIcon>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: "0.86rem",
                          fontWeight: 600,
                          lineHeight: 1.35,
                        }}
                      >
                        {item.label}
                      </Typography>
                      <Typography
                        sx={{
                          color: SHELL_TEXT_MUTED,
                          display: "-webkit-box",
                          fontSize: "0.74rem",
                          lineHeight: 1.5,
                          mt: 0.35,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 2,
                        }}
                      >
                        {item.description}
                      </Typography>
                      {item.supportingText ? (
                        <Typography
                          sx={{
                            color: SHELL_TEXT_FAINT,
                            fontSize: "0.66rem",
                            fontWeight: 700,
                            letterSpacing: "0.14em",
                            mt: 0.65,
                            textTransform: "uppercase",
                          }}
                        >
                          {item.supportingText}
                        </Typography>
                      ) : null}
                    </Box>
                  </ListItemButton>
                  {isPinnedView ? (
                    <Button
                      aria-label={`Remove ${item.label} from pinned work`}
                      density="compact"
                      onClick={() => onTogglePinnedItem(item)}
                      sx={{
                        alignSelf: "center",
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
                  ) : null}
                </Stack>
              </Box>
            ))}
          </List>
        </Box>
      ) : (
        <Typography
          sx={{ color: SHELL_TEXT_MUTED, fontSize: "0.88rem", lineHeight: 1.7, mt: 1.5 }}
        >
          {isPinnedView
            ? "Pin a pursuit or shell view from the command center to keep it visible here."
            : "Open a route or jump to work from the command center and it will appear here for quick return."}
        </Typography>
      )}
    </Surface>
  );
}

function getNavItemIcon(href: string) {
  const sharedProps = { fontSize: "small" as const };

  if (href.startsWith("/opportunities")) {
    return <WorkOutlineRoundedIcon {...sharedProps} />;
  }

  if (href.startsWith("/tasks")) {
    return <ChecklistRoundedIcon {...sharedProps} />;
  }

  if (href.startsWith("/sources")) {
    return <TravelExploreRoundedIcon {...sharedProps} />;
  }

  if (href.startsWith("/knowledge")) {
    return <LibraryBooksRoundedIcon {...sharedProps} />;
  }

  if (href.startsWith("/analytics")) {
    return <InsightsRoundedIcon {...sharedProps} />;
  }

  if (href.startsWith("/settings")) {
    return <SettingsRoundedIcon {...sharedProps} />;
  }

  return <SpaceDashboardRoundedIcon {...sharedProps} />;
}

function getWorkbenchItemIcon(
  item: AppShellWorkbenchItem,
  isPinnedView: boolean,
) {
  if (isPinnedView) {
    return <PushPinRoundedIcon fontSize="small" />;
  }

  if (item.category === "task") {
    return <ChecklistRoundedIcon fontSize="small" />;
  }

  if (item.category === "saved_search") {
    return <TravelExploreRoundedIcon fontSize="small" />;
  }

  if (item.category === "knowledge") {
    return <LibraryBooksRoundedIcon fontSize="small" />;
  }

  if (item.category === "opportunity") {
    return <WorkOutlineRoundedIcon fontSize="small" />;
  }

  return <HistoryRoundedIcon fontSize="small" />;
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

function formatWorkspaceIdentity(organizationId: string) {
  const normalized = organizationId.trim();

  if (!normalized) {
    return {
      label: "OneSource workspace",
      supportingText: null,
    };
  }

  const looksOpaque =
    /^org[_-]/i.test(normalized) ||
    /^[a-z0-9]{20,}$/i.test(normalized) ||
    (/^[a-z0-9_-]+$/i.test(normalized) &&
      /\d/.test(normalized) &&
      !normalized.includes("-") &&
      !normalized.includes("_"));

  if (looksOpaque) {
    return {
      label: "Default workspace",
      supportingText: `Org ID ${normalized.slice(0, 10)}`,
    };
  }

  const label = normalized
    .split(/[-_]+/)
    .filter(Boolean)
    .map((segment) => {
      if (/^\d+$/.test(segment)) {
        return segment;
      }

      return `${segment[0]?.toUpperCase() ?? ""}${segment.slice(1)}`;
    })
    .join(" ");

  return {
    label: label || "OneSource workspace",
    supportingText: null,
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

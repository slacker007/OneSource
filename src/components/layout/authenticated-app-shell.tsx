"use client";

import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import SpaceDashboardRoundedIcon from "@mui/icons-material/SpaceDashboardRounded";
import TravelExploreRoundedIcon from "@mui/icons-material/TravelExploreRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import MuiDrawer from "@mui/material/Drawer";
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
import { onesourceTokens } from "@/theme/onesource-theme";

const SHELL_PINNED_ITEMS_STORAGE_KEY = "onesource.shell.pinned-items";
const SHELL_PREFERENCES_EVENT = "onesource.shell.preferences-changed";
const SHELL_RECENT_DESTINATIONS_STORAGE_KEY =
  "onesource.shell.recent-destinations";
const SHELL_PINNED_ITEM_LIMIT = 6;
const SHELL_RECENT_DESTINATION_LIMIT = 4;
const SHELL_PANEL_BG = onesourceTokens.shell.panel;
const SHELL_PANEL_BORDER = onesourceTokens.shell.panelBorder;
const SHELL_TEXT_PRIMARY = onesourceTokens.shell.textPrimary;
const SHELL_TEXT_SECONDARY = onesourceTokens.shell.textSecondary;
const SHELL_TEXT_FAINT = onesourceTokens.shell.textFaint;
const APP_HEADER_BG = alpha(onesourceTokens.color.background.strong, 0.92);
const APP_HEADER_BORDER = onesourceTokens.color.border.subtle;
const APP_SHELL_CANVAS =
  "radial-gradient(circle at top left, rgba(37,99,235,0.08), transparent 30%), radial-gradient(circle at bottom right, rgba(148,163,184,0.12), transparent 28%), linear-gradient(180deg, rgba(248,250,252,0.96) 0%, rgba(241,245,249,0.98) 100%)";

type NavItem = {
  description: string;
  href: string;
  label: string;
};

type NavGroup = {
  description: string;
  items: NavItem[];
  key: string;
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
    key: "capture_command",
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
    key: "intelligence",
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
  key: "workspace_admin",
  title: "Workspace admin",
  description: "Operator controls and oversight",
  items: [
    {
      href: "/settings",
      label: "Settings",
      description: "Open the workspace admin overview.",
    },
    {
      href: "/settings/connectors",
      label: "Connectors",
      description: "Review connector health, sync runs, and retries.",
    },
    {
      href: "/settings/saved-searches",
      label: "Saved searches",
      description: "Inspect reusable discovery definitions.",
    },
    {
      href: "/settings/scoring",
      label: "Scoring",
      description: "Tune scoring profile and recalibration.",
    },
    {
      href: "/settings/audit",
      label: "Audit",
      description: "Inspect recent workspace mutations.",
    },
    {
      href: "/settings/users",
      label: "Users & Roles",
      description: "Administer invited, active, and disabled users.",
    },
  ],
};

const SHELL_ROUTE_DEFINITIONS: ShellRouteDefinition[] = [
  {
    matcher: "/settings/connectors",
    label: "Connector operations",
    description: "Review connector health, sync runs, and retry posture.",
    navHref: "/settings/connectors",
    requires: "workspace_settings",
  },
  {
    matcher: "/settings/saved-searches",
    label: "Saved searches",
    description: "Inspect reusable discovery definitions and sync recency.",
    navHref: "/settings/saved-searches",
    requires: "workspace_settings",
  },
  {
    matcher: "/settings/scoring",
    label: "Scoring profile",
    description: "Tune scoring thresholds, criteria, and recalibration.",
    navHref: "/settings/scoring",
    requires: "workspace_settings",
  },
  {
    matcher: "/settings/audit",
    label: "Audit activity",
    description: "Inspect recent organization-scoped mutations.",
    navHref: "/settings/audit",
    requires: "workspace_settings",
  },
  {
    matcher: "/settings/users",
    label: "Users & roles",
    description:
      "Manage workspace users, assigned system roles, and access state.",
    navHref: "/settings/users",
    requires: "workspace_settings",
  },
  {
    matcher: "/settings",
    label: "Workspace settings",
    description:
      "Operate connectors, saved searches, scoring, and audit controls.",
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
    description:
      "Start a new tracked opportunity with validated reference data.",
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
    description:
      "Browse reusable assets, taxonomy filters, and linked pursuits.",
    navHref: "/knowledge",
  },
  {
    matcher: "/sources",
    label: "External discovery",
    description:
      "Search source systems, review previews, and import opportunities.",
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
    navItems.find((item) => item.href === activeDestination.navHref) ??
    navItems[0];
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
  const visibleRecentItems = recentItems.filter(
    (item) => item.href !== currentPath,
  );
  const isWideCanvasRoute = currentPath === "/opportunities";
  const shellContentMaxWidth = isWideCanvasRoute ? 1560 : 1280;
  const shellContentPaddingX = isWideCanvasRoute
    ? { lg: 3, sm: 3, xs: 2 }
    : { lg: 4, sm: 3, xs: 2 };
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
    : (flatCommandItems[0]?.id ?? null);
  const notificationCount = shellSnapshot.notifications.totalCount;

  const displayName =
    sessionUser.name ?? sessionUser.email ?? "Authenticated user";
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
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
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
    const link = document.getElementById(
      getCommandLinkId(commandOptionIdPrefix, itemId),
    );
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

  const railWidth = onesourceTokens.sizing.railExpanded;
  const desktopShell = (
    <MuiDrawer
      open
      variant="persistent"
      sx={{
        display: {
          xs: "none",
          lg: "block",
        },
        flexShrink: 0,
        width: railWidth,
        zIndex: 25,
        "& .MuiDrawer-paper": {
          backgroundColor: onesourceTokens.color.surface.raised,
          borderRight: `1px solid ${onesourceTokens.color.border.subtle}`,
          boxSizing: "border-box",
          color: onesourceTokens.color.text.primary,
          overflowX: "hidden",
          overflowY: "hidden",
          px: 1.5,
          py: 1.75,
          top: 0,
          width: railWidth,
        },
      }}
    >
      <Stack spacing={1.25} sx={{ height: "100%", minHeight: 0 }}>
        <Box
          sx={{
            borderBottom: `1px solid ${onesourceTokens.color.border.subtle}`,
            pb: 1.5,
          }}
        >
          <Typography
            sx={{
              color: "text.secondary",
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Workspace
          </Typography>
          <Typography
            sx={{
              fontFamily: "var(--font-heading), sans-serif",
              fontSize: "1rem",
              fontWeight: 600,
              lineHeight: 1.35,
              mt: 0.75,
            }}
          >
            {workspaceIdentity.label}
          </Typography>
          {workspaceIdentity.supportingText ? (
            <Typography
              sx={{
                color: "text.secondary",
                fontSize: "0.76rem",
                lineHeight: 1.4,
                mt: 0.5,
              }}
            >
              {workspaceIdentity.supportingText}
            </Typography>
          ) : null}
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pr: 0.25 }}>
          <NavigationMenu
            currentPath={currentPath}
            groups={navGroups}
            onRememberItem={rememberRecentItem}
            title="Primary navigation"
            variant="desktop"
          />
        </Box>
      </Stack>
    </MuiDrawer>
  );

  return (
    <Box
      sx={{
        background: APP_SHELL_CANVAS,
        display: "flex",
        minHeight: "100vh",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <Drawer
        anchor="left"
        description="Open the compact admin navigation for the authenticated workspace."
        eyebrow="OneSource"
        hideAbove="lg"
        onClose={() => setIsMobileNavOpen(false)}
        open={isMobileNavOpen}
        title="Navigation"
        width={336}
      >
        <Surface
          sx={{
            bgcolor: SHELL_PANEL_BG,
            borderColor: SHELL_PANEL_BORDER,
            boxShadow: "none",
            color: SHELL_TEXT_PRIMARY,
            mt: 1,
            p: 2,
          }}
        >
          <Typography
            sx={{
              color: SHELL_TEXT_FAINT,
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Workspace
          </Typography>
          <Typography
            sx={{
              color: "inherit",
              fontSize: "0.98rem",
              fontWeight: 600,
              mt: 0.8,
            }}
          >
            {workspaceIdentity.label}
          </Typography>
          {workspaceIdentity.supportingText ? (
            <Typography
              sx={{
                color: SHELL_TEXT_SECONDARY,
                fontSize: "0.82rem",
                lineHeight: 1.5,
                mt: 0.65,
              }}
            >
              {workspaceIdentity.supportingText}
            </Typography>
          ) : null}
        </Surface>

        <NavigationMenu
          currentPath={currentPath}
          groups={navGroups}
          onNavigate={() => setIsMobileNavOpen(false)}
          onRememberItem={rememberRecentItem}
          title="Mobile navigation"
          variant="mobile"
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
              {flatCommandItems.length} items available in the shell command
              center.
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
                bgcolor: alpha(onesourceTokens.color.neutral[0], 0.88),
                borderRadius: 3,
                boxShadow: onesourceTokens.elevation.raised,
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
                    <Divider
                      sx={{
                        borderColor: onesourceTokens.color.border.subtle,
                        mb: 2,
                      }}
                    />
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
                          aria-selected={
                            resolvedActiveCommandItemId === item.id
                          }
                          id={optionId}
                          key={item.id}
                          onMouseEnter={() => setActiveCommandItemId(item.id)}
                          role="option"
                          sx={{
                            bgcolor:
                              resolvedActiveCommandItemId === item.id
                                ? alpha(onesourceTokens.color.accent.main, 0.08)
                                : alpha(onesourceTokens.color.neutral[0], 0.86),
                            borderColor:
                              resolvedActiveCommandItemId === item.id
                                ? alpha(onesourceTokens.color.accent.main, 0.22)
                                : onesourceTokens.color.border.subtle,
                            boxShadow:
                              resolvedActiveCommandItemId === item.id
                                ? onesourceTokens.elevation.raised
                                : onesourceTokens.elevation.surface,
                            p: 1,
                          }}
                        >
                          <Stack direction="row" spacing={1}>
                            <Box
                              component={Link}
                              href={item.href}
                              id={getCommandLinkId(
                                commandOptionIdPrefix,
                                item.id,
                              )}
                              onClick={() =>
                                handleCommandItemSelection(workbenchItem)
                              }
                              sx={{
                                borderRadius: 2.5,
                                color: "inherit",
                                display: "block",
                                flex: 1,
                                px: 1.5,
                                py: 1.5,
                                textDecoration: "none",
                                "&:focus-visible": {
                                  bgcolor: alpha(
                                    onesourceTokens.color.accent.main,
                                    0.08,
                                  ),
                                  outline: `2px solid ${alpha(onesourceTokens.color.accent.main, 0.28)}`,
                                  outlineOffset: 2,
                                },
                                "&:hover": {
                                  bgcolor: alpha(
                                    onesourceTokens.color.accent.main,
                                    0.04,
                                  ),
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
                                  <Typography
                                    sx={{
                                      fontSize: "0.94rem",
                                      fontWeight: 600,
                                    }}
                                  >
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
                bgcolor: alpha(onesourceTokens.color.neutral[0], 0.84),
                borderColor: onesourceTokens.color.border.strong,
                borderStyle: "dashed",
                p: 3,
              }}
            >
              <Typography
                sx={{
                  color: "text.secondary",
                  fontSize: "0.92rem",
                  lineHeight: 1.7,
                }}
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
                  bgcolor: alpha(onesourceTokens.color.neutral[0], 0.9),
                  border: "1px solid",
                  borderColor: onesourceTokens.color.border.subtle,
                  borderRadius: 3,
                  color: "inherit",
                  display: "block",
                  px: 2.5,
                  py: 2,
                  textDecoration: "none",
                  transition:
                    "background-color 140ms ease, border-color 140ms ease",
                  "&:hover": {
                    bgcolor: alpha(onesourceTokens.color.accent.main, 0.05),
                    borderColor: alpha(onesourceTokens.color.accent.main, 0.2),
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
              bgcolor: alpha(onesourceTokens.color.neutral[0], 0.84),
              borderColor: onesourceTokens.color.border.strong,
              borderStyle: "dashed",
              p: 3,
            }}
          >
            <Typography
              sx={{
                color: "text.secondary",
                fontSize: "0.92rem",
                lineHeight: 1.7,
              }}
            >
              No active alerts are queued in the shell right now. Overdue tasks,
              upcoming reminders, and saved-search issues will appear here.
            </Typography>
          </Surface>
        )}
      </Dialog>

      {desktopShell}

      <Box
        sx={{ display: "flex", flex: 1, flexDirection: "column", minWidth: 0 }}
      >
        <Box
          component="header"
          sx={{
            backdropFilter: "blur(18px)",
            backgroundColor: APP_HEADER_BG,
            borderBottom: `1px solid ${APP_HEADER_BORDER}`,
            position: "sticky",
            px: shellContentPaddingX,
            py: 2,
            top: 0,
            zIndex: 20,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              marginX: "auto",
              maxWidth: shellContentMaxWidth,
              minWidth: 0,
            }}
          >
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
                      boxShadow: onesourceTokens.elevation.surface,
                      justifyContent: "space-between",
                      px: 2,
                      py: 1.5,
                      width: "100%",
                      "&:hover": {
                        borderColor: alpha(
                          onesourceTokens.color.accent.main,
                          0.24,
                        ),
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
                      <Typography
                        sx={{ color: "text.secondary", fontSize: "0.9rem" }}
                      >
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
                      boxShadow: onesourceTokens.elevation.surface,
                      whiteSpace: "nowrap",
                    }}
                    tone="neutral"
                    type="button"
                    variant="outlined"
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "center" }}
                    >
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
                    <Typography
                      sx={{ color: "text.secondary", fontSize: "0.76rem" }}
                    >
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

        <Box
          component="main"
          sx={{ flex: 1, minWidth: 0, px: shellContentPaddingX, py: 3 }}
        >
          <Box
            sx={{
              marginX: "auto",
              maxWidth: shellContentMaxWidth,
              minWidth: 0,
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function NavigationMenu({
  currentPath,
  groups,
  onNavigate,
  onRememberItem,
  title,
  variant,
}: {
  currentPath: string;
  groups: NavGroup[];
  onNavigate?: () => void;
  onRememberItem?: (item: AppShellWorkbenchItem) => void;
  title: string;
  variant: "desktop" | "mobile";
}) {
  const desktopVariant = variant === "desktop";

  return (
    <Stack
      component="nav"
      aria-label={title}
      id={title === "Mobile navigation" ? "mobile-navigation" : undefined}
      spacing={desktopVariant ? 1.25 : 2}
    >
      {groups.map((group) => {
        const activeItem = group.items.reduce<
          (typeof group.items)[number] | null
        >((bestMatch, candidate) => {
          if (!isRouteActive(candidate.href, currentPath)) {
            return bestMatch;
          }

          if (!bestMatch || candidate.href.length > bestMatch.href.length) {
            return candidate;
          }

          return bestMatch;
        }, null);

        return (
          <Box component="section" key={group.key}>
            <Box
              sx={{
                px: desktopVariant ? 0.75 : 1,
                pb: desktopVariant ? 0.5 : 0.75,
              }}
            >
              <Typography
                sx={{
                  color: desktopVariant ? "text.secondary" : SHELL_TEXT_FAINT,
                  fontSize: desktopVariant ? "0.64rem" : "0.68rem",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                {group.title}
              </Typography>
            </Box>
            <List disablePadding sx={{ mt: desktopVariant ? 0.25 : 0.5 }}>
              {group.items.map((item) => {
                const active = item.href === activeItem?.href;

                return (
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
                      alignItems: "center",
                      borderRadius: desktopVariant ? 0 : 2.5,
                      color: desktopVariant
                        ? active
                          ? "text.primary"
                          : "text.secondary"
                        : active
                          ? SHELL_TEXT_PRIMARY
                          : SHELL_TEXT_SECONDARY,
                      mb: desktopVariant ? 0.25 : 0.6,
                      minHeight: desktopVariant ? 40 : 46,
                      px: desktopVariant ? 1 : 1.4,
                      py: desktopVariant ? 0.5 : 0.85,
                      "&.Mui-selected": desktopVariant
                        ? {
                            backgroundColor: alpha(
                              onesourceTokens.color.accent.main,
                              0.1,
                            ),
                            color: "text.primary",
                          }
                        : {
                            backgroundColor: alpha(
                              onesourceTokens.shell.brandAccent,
                              0.14,
                            ),
                          },
                      "&.Mui-selected:hover": desktopVariant
                        ? {
                            backgroundColor: alpha(
                              onesourceTokens.color.accent.main,
                              0.14,
                            ),
                          }
                        : {
                            backgroundColor: alpha(
                              onesourceTokens.shell.brandAccent,
                              0.2,
                            ),
                          },
                      "&:hover": desktopVariant
                        ? {
                            backgroundColor: "action.hover",
                          }
                        : {
                            backgroundColor: alpha(
                              onesourceTokens.color.neutral[0],
                              0.08,
                            ),
                            color: SHELL_TEXT_PRIMARY,
                          },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: "inherit",
                        justifyContent: "center",
                        minWidth: desktopVariant ? 32 : 38,
                      }}
                    >
                      {getNavItemIcon(item.href)}
                    </ListItemIcon>
                    <Typography
                      sx={{
                        color: "inherit",
                        fontSize: desktopVariant ? "0.88rem" : "0.92rem",
                        fontWeight: 600,
                        lineHeight: 1.35,
                      }}
                    >
                      {item.label}
                    </Typography>
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        );
      })}
    </Stack>
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
      description:
        "Capture reusable narrative, win themes, or past performance.",
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
      description:
        "Open external discovery with the current shell context intact.",
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
      description:
        "Jump to ranked pursuit review and portfolio decision support.",
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
  const workbenchItems = [
    ...navGroups.flatMap((group) => group.items),
    ...quickLinks,
  ]
    .map(createWorkbenchItemFromNavItem)
    .filter(
      (candidate, index, items) =>
        items.findIndex((item) => item.href === candidate.href) === index,
    );

  return workbenchItems.map((item) => ({
    ...createCommandItemFromWorkbenchItem(item),
    keywords: [item.label, item.description, item.supportingText ?? ""].filter(
      Boolean,
    ),
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
    if (candidate.requires === "decision_support" && !allowDecisionSupport) {
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

function readRecentWorkbenchItemsSnapshot() {
  if (typeof window === "undefined") {
    return "[]";
  }

  try {
    return (
      window.localStorage.getItem(SHELL_RECENT_DESTINATIONS_STORAGE_KEY) ?? "[]"
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
    category: isCommandCategory(candidate.category)
      ? candidate.category
      : "view",
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
              allItems.findIndex(
                (candidate) => candidate.href === item.href,
              ) === index,
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

function getCommandOptionId(prefix: string, itemId: string) {
  return `${prefix}-option-${itemId}`;
}

function getCommandLinkId(prefix: string, itemId: string) {
  return `${prefix}-link-${itemId}`;
}

function isCommandCategory(value: unknown): value is AppShellCommandCategory {
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

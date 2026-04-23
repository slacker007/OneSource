import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AppShellFrame } from "@/components/layout/authenticated-app-shell";
import type { AppShellSnapshot } from "@/modules/shell/app-shell.types";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

function buildShellSnapshot(): AppShellSnapshot {
  return {
    commandSections: [
      {
        key: "opportunities",
        label: "Pinned pursuits",
        items: [
          {
            id: "opportunity-1",
            category: "opportunity",
            description:
              "Capture Active · Department of Veterans Affairs · Deadline May 8",
            href: "/opportunities/opp_1",
            label: "VA Intake Modernization BPA",
            navHref: "/opportunities",
            keywords: ["VA", "Modernization", "Capture Active"],
            supportingText: "36C10B-26-R-0101",
          },
        ],
      },
      {
        key: "tasks",
        label: "Assigned tasks",
        items: [
          {
            id: "task-1",
            category: "task",
            description: "VA Intake Modernization BPA · Critical · Due Apr 18",
            href: "/opportunities/opp_1",
            label: "Confirm teaming posture",
            navHref: "/tasks",
            keywords: ["teaming", "critical"],
            supportingText: "Overdue reminder",
          },
        ],
      },
      {
        key: "saved_searches",
        label: "Saved searches",
        items: [
          {
            id: "saved-search-1",
            category: "saved_search",
            description: "SAM.gov · cloud intake · Last run Apr 18",
            href: "/sources?source=sam_gov&keywords=cloud+intake",
            label: "Daily VA cloud search",
            navHref: "/sources",
            keywords: ["SAM.gov", "cloud intake"],
            supportingText: "SAM.gov",
          },
        ],
      },
    ],
    notifications: {
      items: [
        {
          href: "/opportunities/opp_1",
          id: "notification-overdue-task",
          summary: "VA Intake Modernization BPA · Due Apr 18",
          timestamp: "2026-04-18T17:00:00.000Z",
          title: "Critical task overdue",
          tone: "danger",
        },
        {
          href: "/sources",
          id: "notification-saved-search",
          summary: "SAM.gov returned HTTP 429.",
          timestamp: "2026-04-19T08:00:10.000Z",
          title: "Saved search issue: Daily VA cloud search",
          tone: "warning",
        },
      ],
      totalCount: 2,
    },
  };
}

describe("AppShellFrame", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders a desktop persistent drawer with grouped navigation and shell controls", () => {
    render(
      <AppShellFrame
        allowDecisionSupport
        allowWorkspaceSettings
        currentPath="/sources"
        sessionUser={{
          email: "admin@onesource.local",
          name: "Admin User",
          organizationId: "org_123",
          roleKeys: ["admin"],
          userId: "user_123",
        }}
        shellSnapshot={buildShellSnapshot()}
      >
        <div>Page content</div>
      </AppShellFrame>,
    );

    expect(
      screen.getByRole("navigation", { name: /primary navigation/i }),
    ).toBeInTheDocument();
    const primaryNavigation = screen.getByRole("navigation", {
      name: /primary navigation/i,
    });
    expect(screen.getByRole("link", { name: /^sources/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("button", { name: /open command search/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /open notifications/i }),
    ).toHaveTextContent("2");
    expect(
      screen.queryByRole("button", { name: /expand navigation rail/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /collapse navigation rail/i }),
    ).not.toBeInTheDocument();
    expect(
      within(primaryNavigation).getByText(/^capture command$/i),
    ).toBeInTheDocument();
    expect(
      within(primaryNavigation).getByText(/^intelligence$/i),
    ).toBeInTheDocument();
    expect(
      within(primaryNavigation).getByText(/^workspace admin$/i),
    ).toBeInTheDocument();
    expect(
      within(primaryNavigation).getByRole("link", { name: /^sources$/i }),
    ).toBeInTheDocument();
    expect(
      within(primaryNavigation).getByRole("link", { name: /^users & roles$/i }),
    ).toBeInTheDocument();
  });

  it("opens the command center, filters results, and persists pinned work", async () => {
    window.localStorage.setItem(
      "onesource.shell.recent-destinations",
      JSON.stringify([
        {
          category: "knowledge",
          description: "Win theme · Updated Apr 17",
          href: "/knowledge?query=Zero%20Trust%20Transition%20Narrative",
          label: "Zero Trust Transition Narrative",
          navHref: "/knowledge",
          supportingText: "Win theme",
        },
      ]),
    );

    render(
      <AppShellFrame
        allowDecisionSupport
        allowWorkspaceSettings={false}
        currentPath="/tasks"
        sessionUser={{
          email: "capture@onesource.local",
          name: "Capture Lead",
          organizationId: "org_123",
          roleKeys: ["capture_manager"],
          userId: "user_123",
        }}
        shellSnapshot={buildShellSnapshot()}
      >
        <div>Task page</div>
      </AppShellFrame>,
    );

    const commandLauncher = screen.getByRole("button", {
      name: /open command search/i,
    });

    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(
      screen.getByRole("dialog", { name: /command center/i }),
    ).toBeInTheDocument();

    const commandSearch = screen.getByRole("searchbox", {
      name: /command search/i,
    });
    await waitFor(() => expect(commandSearch).toHaveFocus());
    expect(commandLauncher).not.toHaveFocus();
    fireEvent.change(commandSearch, { target: { value: "va intake" } });
    expect(
      screen.getAllByRole("link", { name: /va intake modernization bpa/i })
        .length,
    ).toBeGreaterThan(0);

    fireEvent.click(
      screen.getByRole("button", {
        name: /pin va intake modernization bpa to pinned work/i,
      }),
    );

    await waitFor(() =>
      expect(
        window.localStorage.getItem("onesource.shell.pinned-items"),
      ).toContain("/opportunities/opp_1"),
    );

    commandSearch.focus();
    fireEvent.keyDown(commandSearch, { key: "Escape" });
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: /command center/i }),
      ).not.toBeInTheDocument(),
    );

    fireEvent.click(commandLauncher);
    expect(screen.getByText(/^pinned work$/i)).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /va intake modernization bpa/i })
        .length,
    ).toBeGreaterThan(0);
  }, 10_000);

  it("opens notifications and preserves mobile navigation restrictions", async () => {
    render(
      <AppShellFrame
        allowDecisionSupport={false}
        allowWorkspaceSettings={false}
        currentPath="/"
        sessionUser={{
          email: "viewer@onesource.local",
          name: "Viewer User",
          organizationId: "org_123",
          roleKeys: ["viewer"],
          userId: "user_456",
        }}
        shellSnapshot={buildShellSnapshot()}
      >
        <div>Dashboard content</div>
      </AppShellFrame>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /open notifications/i }),
    );
    expect(
      screen.getByRole("dialog", { name: /notifications/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/critical task overdue/i)).toBeInTheDocument();

    const mobileNavigationButton = screen.getByRole("button", {
      name: /open navigation menu/i,
    });
    fireEvent.click(mobileNavigationButton);

    expect(
      screen.getByRole("navigation", { name: /mobile navigation/i }),
    ).toBeInTheDocument();
    expect(mobileNavigationButton).not.toHaveFocus();
    expect(
      screen.queryByRole("link", { name: /^settings$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^users & roles$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^analytics$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /decision console/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: /^navigation$/i }),
    ).toBeInTheDocument();
  }, 20_000);

  it("remembers visited destinations without a desktop collapse state", async () => {
    const user = userEvent.setup();

    window.localStorage.setItem(
      "onesource.shell.recent-destinations",
      JSON.stringify([
        {
          category: "knowledge",
          description:
            "Browse reusable assets, taxonomy filters, and linked pursuits.",
          href: "/knowledge",
          label: "Knowledge library",
          navHref: "/knowledge",
          supportingText: "Shell view",
        },
      ]),
    );

    render(
      <AppShellFrame
        allowDecisionSupport
        allowWorkspaceSettings={false}
        currentPath="/tasks"
        sessionUser={{
          email: "capture@onesource.local",
          name: "Capture Lead",
          organizationId: "org_123",
          roleKeys: ["capture_manager"],
          userId: "user_123",
        }}
        shellSnapshot={buildShellSnapshot()}
      >
        <div>Task page</div>
      </AppShellFrame>,
    );

    const primaryNavigation = screen.getByRole("navigation", {
      name: /primary navigation/i,
    });
    expect(
      screen.queryByRole("button", { name: /expand navigation rail/i }),
    ).not.toBeInTheDocument();
    expect(
      within(primaryNavigation).getByText(/^capture command$/i),
    ).toBeInTheDocument();
    await user.click(
      within(primaryNavigation).getByRole("link", { name: /^tasks/i }),
    );

    await waitFor(() =>
      expect(
        window.localStorage.getItem("onesource.shell.recent-destinations"),
      ).toContain("/tasks"),
    );
    expect(
      within(primaryNavigation).getByRole("link", { name: /^dashboard$/i }),
    ).toBeInTheDocument();
    expect(
      window.localStorage.getItem("onesource.shell.is-collapsed"),
    ).toBeNull();
  }, 20_000);

  it("highlights only the most specific workspace admin route", () => {
    render(
      <AppShellFrame
        allowDecisionSupport
        allowWorkspaceSettings
        currentPath="/settings/users"
        sessionUser={{
          email: "admin@onesource.local",
          name: "Admin User",
          organizationId: "org_123",
          roleKeys: ["admin"],
          userId: "user_123",
        }}
        shellSnapshot={buildShellSnapshot()}
      >
        <div>Users page</div>
      </AppShellFrame>,
    );

    const primaryNavigation = screen.getByRole("navigation", {
      name: /primary navigation/i,
    });
    const settingsLink = within(primaryNavigation).getByRole("link", {
      name: /^settings$/i,
    });
    const usersLink = within(primaryNavigation).getByRole("link", {
      name: /^users & roles$/i,
    });

    expect(usersLink).toHaveAttribute("aria-current", "page");
    expect(settingsLink).not.toHaveAttribute("aria-current");
  });
});

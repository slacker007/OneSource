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
            description:
              "VA Intake Modernization BPA · Critical · Due Apr 18",
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

  it("renders grouped navigation, command launch, quick links, and shell orientation", () => {
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
    expect(
      within(primaryNavigation).getByText(/^capture command$/i),
    ).toBeInTheDocument();
    expect(
      within(primaryNavigation).getByText(/^intelligence$/i),
    ).toBeInTheDocument();
    expect(
      within(primaryNavigation).getByText(/^workspace admin$/i),
    ).toBeInTheDocument();
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
      screen.getByRole("button", { name: /collapse navigation rail/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/^external discovery$/i)[0]).toBeInTheDocument();

    const quickLinks = within(
      screen.getAllByText(/^quick links$/i)[0].closest("section")!,
    );
    expect(
      quickLinks.getByRole("link", { name: /create pursuit/i }),
    ).toHaveAttribute("href", "/opportunities/new");
    expect(
      quickLinks.getByRole("link", { name: /decision console/i }),
    ).toHaveAttribute("href", "/analytics");
    expect(
      quickLinks.getByRole("link", { name: /workspace settings/i }),
    ).toHaveAttribute("href", "/settings");
  });

  it("opens the command center, filters results, and persists pinned work", async () => {
    const user = userEvent.setup();

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
    await user.type(commandSearch, "va intake");
    expect(
      screen.getAllByRole("link", { name: /va intake modernization bpa/i }).length,
    ).toBeGreaterThan(0);

    await user.click(
      screen.getByRole("button", {
        name: /pin va intake modernization bpa to pinned work/i,
      }),
    );

    await waitFor(() =>
      expect(window.localStorage.getItem("onesource.shell.pinned-items")).toContain(
        "/opportunities/opp_1",
      ),
    );

    expect(
      screen.getAllByText(/^pinned work$/i)[0].closest("section"),
    ).toHaveTextContent(/va intake modernization bpa/i);

    await user.click(commandSearch);
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: /command center/i }),
      ).not.toBeInTheDocument(),
    );
  });

  it("opens notifications and preserves mobile navigation restrictions", async () => {
    const user = userEvent.setup();

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

    await user.click(
      screen.getByRole("button", { name: /open notifications/i }),
    );
    expect(
      screen.getByRole("dialog", { name: /notifications/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/critical task overdue/i)).toBeInTheDocument();

    const mobileNavigationButton = screen.getByRole("button", {
      name: /open navigation menu/i,
    });
    await user.click(
      mobileNavigationButton,
    );

    expect(
      screen.getByRole("navigation", { name: /mobile navigation/i }),
    ).toBeInTheDocument();
    expect(mobileNavigationButton).not.toHaveFocus();
    expect(
      screen.queryByRole("link", { name: /^settings$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^analytics$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /decision console/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: /onesource workspace/i }),
    ).toBeInTheDocument();
  });

  it("surfaces recent work and persists the collapse toggle", async () => {
    const user = userEvent.setup();

    window.localStorage.setItem(
      "onesource.shell.recent-destinations",
      JSON.stringify([
        {
          category: "knowledge",
          description: "Browse reusable assets, taxonomy filters, and linked pursuits.",
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

    await user.click(screen.getByRole("link", { name: /review my tasks/i }));

    await waitFor(() =>
      expect(
        window.localStorage.getItem("onesource.shell.recent-destinations"),
      ).toContain("/tasks"),
    );

    const recentWork = within(
      screen.getAllByText(/^recent work$/i)[0].closest("section")!,
    );
    expect(
      recentWork.getByRole("link", { name: /knowledge library/i }),
    ).toHaveAttribute("href", "/knowledge");

    await user.click(
      screen.getByRole("button", { name: /collapse navigation rail/i }),
    );

    expect(window.localStorage.getItem("onesource.shell.is-collapsed")).toBe(
      "1",
    );
    expect(
      screen.getByRole("button", { name: /expand navigation rail/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/frequent jumps that stay attached to the shell/i),
    ).not.toBeInTheDocument();
  });
});

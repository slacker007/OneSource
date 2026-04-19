import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AppShellFrame } from "@/components/layout/authenticated-app-shell";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

describe("AppShellFrame", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders grouped navigation, quick links, and shell orientation", () => {
    render(
      <AppShellFrame
        allowDecisionSupport
        allowWorkspaceSettings
        currentPath="/sources"
        sessionUser={{
          email: "admin@onesource.local",
          name: "Admin User",
          roleKeys: ["admin"],
        }}
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
      screen.getByRole("searchbox", { name: /global search/i }),
    ).toHaveAttribute(
      "placeholder",
      "Search opportunities, agencies, or notice IDs",
    );
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

  it("opens the mobile navigation drawer without restricted destinations", async () => {
    const user = userEvent.setup();

    render(
      <AppShellFrame
        allowDecisionSupport={false}
        allowWorkspaceSettings={false}
        currentPath="/"
        sessionUser={{
          email: "viewer@onesource.local",
          name: "Viewer User",
          roleKeys: ["viewer"],
        }}
      >
        <div>Dashboard content</div>
      </AppShellFrame>,
    );

    await user.click(
      screen.getByRole("button", { name: /open navigation menu/i }),
    );

    expect(
      screen.getByRole("navigation", { name: /mobile navigation/i }),
    ).toBeInTheDocument();
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
          description: "Browse reusable assets, taxonomy filters, and linked pursuits.",
          href: "/knowledge",
          label: "Knowledge library",
          navHref: "/knowledge",
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
          roleKeys: ["capture_manager"],
        }}
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

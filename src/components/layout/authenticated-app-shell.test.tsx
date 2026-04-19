import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AppShellFrame } from "@/components/layout/authenticated-app-shell";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

describe("AppShellFrame", () => {
  it("renders the primary navigation and search placeholder", () => {
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
    expect(screen.getByRole("link", { name: /^sources/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: /^knowledge/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("searchbox", { name: /global search/i }),
    ).toHaveAttribute(
      "placeholder",
      "Search opportunities, agencies, or notice IDs",
    );
    expect(
      screen.getByRole("link", { name: /^settings/i }),
    ).toBeInTheDocument();
  });

  it("opens the mobile navigation drawer", async () => {
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
      screen.queryByRole("link", { name: /^settings/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^analytics/i }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText(/onesource workspace/i)).toHaveLength(2);
  });
});

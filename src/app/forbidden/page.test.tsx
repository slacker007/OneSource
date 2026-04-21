import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ForbiddenPage from "./page";

describe("ForbiddenPage", () => {
  it("renders the permission-denied state for a blocked settings route", async () => {
    render(
      await ForbiddenPage({
        searchParams: Promise.resolve({
          permission: "manage_workspace_settings",
        }),
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: /you do not have access to manage workspace settings/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /return to dashboard/i }),
    ).toHaveAttribute("href", "/");
  });
});

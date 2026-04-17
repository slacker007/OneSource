import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppShellPreview } from "@/components/home/app-shell-preview";

describe("AppShellPreview", () => {
  it("renders the foundation homepage shell", () => {
    render(<AppShellPreview />);

    expect(
      screen.getByRole("heading", {
        name: /government opportunity tracking with audit-ready decisions/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/3 opportunities need executive review this week/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: /primary/i }),
    ).toBeInTheDocument();
  });
});

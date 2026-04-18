import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { SourceIntakePreview } from "./source-intake-preview";

describe("SourceIntakePreview", () => {
  it("renders the shared source-search preview surface", () => {
    render(<SourceIntakePreview />);

    expect(
      screen.getByRole("heading", {
        name: /search and import patterns are now standardized/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /canonical query form/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /source preview results/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/live search execution is not available yet/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no saved source searches yet/i),
    ).toBeInTheDocument();
  });

  it("opens the shared import preview dialog", async () => {
    const user = userEvent.setup();

    render(<SourceIntakePreview />);

    await user.click(
      screen.getByRole("button", { name: /preview import review/i }),
    );

    expect(
      screen.getByRole("dialog", { name: /import preview/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/preserve source lineage, raw payloads, and normalized data/i),
    ).toBeInTheDocument();
  });
});

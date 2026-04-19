import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { KnowledgeCopyButton } from "./knowledge-copy-button";

describe("KnowledgeCopyButton", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("copies the requested text and confirms the action", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: {
        writeText,
      },
    });

    render(
      <KnowledgeCopyButton
        label="Copy reusable content"
        text="Reusable capture narrative"
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /copy reusable content/i }),
    );

    expect(writeText).toHaveBeenCalledWith("Reusable capture narrative");
    expect(
      screen.getByRole("button", { name: /copied/i }),
    ).toBeInTheDocument();
  });
});

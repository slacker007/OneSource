import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";

describe("UI overlay primitives", () => {
  it("renders dialog structure and close affordances", () => {
    const onClose = vi.fn();

    render(
      <Dialog
        description="Overlay guidance"
        footer={<button type="button">Confirm</button>}
        onClose={onClose}
        open
        title="Review changes"
      >
        <p>Dialog body</p>
      </Dialog>,
    );

    expect(screen.getByRole("dialog", { name: /review changes/i })).toBeInTheDocument();
    expect(screen.getByText(/overlay guidance/i)).toBeInTheDocument();
    expect(screen.getByText(/dialog body/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /dismiss review changes/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders drawer structure and close affordances", () => {
    const onClose = vi.fn();

    render(
      <Drawer
        description="Navigation shortcuts"
        eyebrow="Workspace"
        onClose={onClose}
        open
        title="Quick navigation"
      >
        <button type="button">Open route</button>
      </Drawer>,
    );

    expect(screen.getByRole("presentation")).toBeInTheDocument();
    expect(screen.getByText(/workspace/i)).toBeInTheDocument();
    expect(screen.getByText(/quick navigation/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /dismiss quick navigation/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

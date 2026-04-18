import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppErrorBoundary } from "./app-error-boundary";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AppErrorBoundary", () => {
  it("renders the fallback state and lets the user retry the route", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <AppErrorBoundary
        error={Object.assign(new Error("Route failed"), {
          digest: "digest-123",
        })}
        reset={reset}
        scopeLabel="Authenticated workspace"
        title="Workspace recovery"
      />,
    );

    expect(screen.getByRole("heading", { name: /workspace recovery/i })).toBeVisible();
    expect(screen.getByText(/error digest:/i)).toBeVisible();

    await user.click(screen.getByRole("button", { name: /retry route/i }));

    expect(reset).toHaveBeenCalledTimes(1);
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ActionFeedback } from "@/components/ui/action-feedback";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingSurface } from "@/components/ui/loading-surface";
import { PermissionDeniedState } from "@/components/ui/permission-denied-state";
import { Skeleton } from "@/components/ui/skeleton";

describe("UI state patterns", () => {
  it("renders shared empty, error, and permission states", () => {
    render(
      <div>
        <EmptyState
          action={<button type="button">Create record</button>}
          message="No records match the current filter set."
          title="No opportunities yet"
        />
        <ErrorState
          message="The current request could not be completed."
          title="Load failed"
        />
        <PermissionDeniedState blockedArea="workspace settings" />
      </div>,
    );

    expect(screen.getByRole("heading", { name: /no opportunities yet/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /create record/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /load failed/i })).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: /you do not have access to workspace settings/i,
      }),
    ).toBeVisible();
  });

  it("renders shared action feedback with alert and status semantics", () => {
    render(
      <ActionFeedback
        errorMessage="Update the required fields before retrying."
        errorTitle="Needs attention"
        successMessage="The latest change was saved."
        successTitle="Saved"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /update the required fields before retrying/i,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      /the latest change was saved/i,
    );
  });

  it("renders loading surfaces with shared skeleton framing", () => {
    const { container } = render(
      <LoadingSurface actionCount={2} titleWidth={240}>
        <Skeleton height={48} width="100%" />
      </LoadingSurface>,
    );

    expect(container.querySelectorAll(".MuiSkeleton-root").length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PermissionDeniedState } from "@/components/ui/permission-denied-state";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

describe("UI foundation primitives", () => {
  it("renders semantic badge tones", () => {
    render(
      <div>
        <Badge tone="success">Go</Badge>
        <Badge tone="warning">Watch</Badge>
        <Badge tone="danger">Blocked</Badge>
      </div>,
    );

    expect(screen.getByText("Go")).toHaveClass("bg-success-soft");
    expect(screen.getByText("Watch")).toHaveClass("bg-warning-soft");
    expect(screen.getByText("Blocked")).toHaveClass("bg-danger-soft");
  });

  it("renders empty, error, and permission-denied states with shared copy structure", () => {
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

    expect(screen.getByText(/no matching records/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create record/i })).toBeInTheDocument();
    expect(screen.getByText(/attention required/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /you do not have access to workspace settings/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /return to dashboard/i })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("renders compact field primitives and skeletons", () => {
    render(
      <div>
        <FormField error="Required field" hint="Compact input styling." label="Title">
          <Input placeholder="Opportunity title" />
        </FormField>
        <Select aria-label="Status">
          <option>Open</option>
        </Select>
        <Textarea aria-label="Summary" />
        <Skeleton className="h-12 w-48" data-testid="skeleton" />
      </div>,
    );

    expect(screen.getByPlaceholderText(/opportunity title/i)).toHaveClass(
      "ui-field",
    );
    expect(screen.getByRole("combobox", { name: /status/i })).toHaveClass("ui-field");
    expect(screen.getByRole("textbox", { name: /summary/i })).toHaveClass("ui-field");
    expect(screen.getByText(/required field/i)).toHaveClass("text-danger");
    expect(screen.getByTestId("skeleton")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("skeleton")).toHaveClass("ui-skeleton");
  });
});

import { renderToString } from "react-dom/server";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PermissionDeniedState } from "@/components/ui/permission-denied-state";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";
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

    expect(screen.getByText("Go")).toBeInTheDocument();
    expect(screen.getByText("Watch")).toBeInTheDocument();
    expect(screen.getByText("Blocked")).toBeInTheDocument();
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
    expect(
      screen.getByRole("heading", {
        name: /you do not have access to workspace settings/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /return to dashboard/i })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("renders field wrappers, buttons, banners, surfaces, and skeletons", () => {
    render(
      <div>
        <FormField error="Required field" hint="Compact input styling." label="Title">
          <Input placeholder="Opportunity title" />
        </FormField>
        <Select aria-label="Status">
          <option>Open</option>
        </Select>
        <Textarea aria-label="Summary" />
        <FeedbackBanner
          message="The latest change was saved."
          role="status"
          title="Saved"
          tone="success"
        />
        <Surface data-testid="surface">Preview shell</Surface>
        <Button type="button">Continue</Button>
        <Skeleton data-testid="skeleton" height={48} width={192} />
      </div>,
    );

    expect(screen.getByPlaceholderText(/opportunity title/i)).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining("-hint"),
    );
    expect(screen.getByRole("combobox", { name: /status/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /summary/i })).toBeInTheDocument();
    expect(screen.getByText(/required field/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/saved/i);
    expect(screen.getByTestId("surface")).toHaveTextContent(/preview shell/i);
    expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
    expect(screen.getByTestId("skeleton")).toHaveAttribute("aria-hidden", "true");
  });

  it("server-renders field wrappers around shared inputs without crashing", () => {
    expect(() =>
      renderToString(
        <div>
          <FormField hint="Search the queue." htmlFor="server-render-search" label="Search">
            <Input id="server-render-search" name="q" type="search" />
          </FormField>
          <FormField htmlFor="server-render-status" label="Status">
            <Select id="server-render-status" name="status">
              <option value="">All statuses</option>
              <option value="open">Open</option>
            </Select>
          </FormField>
        </div>,
      ),
    ).not.toThrow();
  });
});

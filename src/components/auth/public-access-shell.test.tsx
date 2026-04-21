import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PublicAccessShell } from "@/components/auth/public-access-shell";

describe("PublicAccessShell", () => {
  it("renders the shared public access shell with intro content", () => {
    render(
      <PublicAccessShell
        description={
          <span>
            Sign in with the seeded local account to review the OneSource workspace.
          </span>
        }
        eyebrow="OneSource Access"
        title="Sign in to OneSource."
      >
        <button type="button">Continue</button>
      </PublicAccessShell>,
    );

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /sign in to onesource/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/seeded local account/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
  });

  it("supports content-only public surfaces without duplicating intro copy", () => {
    render(
      <PublicAccessShell>
        <div>Restricted workspace message</div>
      </PublicAccessShell>,
    );

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByText(/restricted workspace message/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /sign in to onesource/i }),
    ).not.toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AdminConsole } from "./admin-console";

describe("AdminConsole", () => {
  it("renders user-role visibility and recent audit activity", () => {
    render(
      <AdminConsole
        sessionUser={{
          name: "Alex Morgan",
          email: "admin@onesource.local",
        }}
        snapshot={{
          organizationId: "org_123",
          organizationName: "Default Organization",
          totalUserCount: 2,
          adminUserCount: 1,
          totalAuditLogCount: 9,
          users: [
            {
              id: "user_admin",
              name: "Alex Morgan",
              email: "admin@onesource.local",
              status: "ACTIVE",
              roleKeys: ["admin", "executive"],
              roleLabels: ["Admin", "Executive"],
              roles: [
                {
                  key: "admin",
                  label: "Admin",
                  assignedAt: "2026-04-18T01:00:00.000Z",
                },
                {
                  key: "executive",
                  label: "Executive",
                  assignedAt: "2026-04-18T01:01:00.000Z",
                },
              ],
            },
            {
              id: "user_viewer",
              name: null,
              email: "avery.stone@onesource.local",
              status: "INVITED",
              roleKeys: [],
              roleLabels: [],
              roles: [],
            },
          ],
          recentAuditEvents: [
            {
              id: "audit_1",
              occurredAt: "2026-04-18T01:00:00.000Z",
              action: "seed.bootstrap",
              actionLabel: "Seed / Bootstrap",
              actorType: "USER",
              actorLabel: "Alex Morgan",
              targetLabel: "Default Organization",
              targetType: "organization",
              summary: "Initialized baseline organization.",
              metadataPreview: "{\"seededOpportunityCount\":5}",
            },
          ],
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /admin console/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /assigned roles/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /recent audit activity/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /assigned roles/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /recent audit activity/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/admin@onesource\.local/i)).toHaveLength(2);
    expect(screen.getByText(/no roles assigned/i)).toBeInTheDocument();
    expect(screen.getByText("seed.bootstrap")).toBeInTheDocument();
  });

  it("renders a clear empty state when the organization snapshot is unavailable", () => {
    render(
      <AdminConsole
        sessionUser={{
          email: "admin@onesource.local",
        }}
        snapshot={null}
      />,
    );

    expect(
      screen.getByText(/organization-scoped admin data could not be loaded/i),
    ).toBeInTheDocument();
  });

  it("shows empty shared table states when snapshot lists are empty", async () => {
    const user = userEvent.setup();

    render(
      <AdminConsole
        sessionUser={{
          email: "admin@onesource.local",
        }}
        snapshot={{
          organizationId: "org_123",
          organizationName: "Default Organization",
          totalUserCount: 0,
          adminUserCount: 0,
          totalAuditLogCount: 0,
          users: [],
          recentAuditEvents: [],
        }}
      />,
    );

    await user.click(screen.getByRole("heading", { name: /assigned roles/i }));

    expect(
      screen.getByText(/no organization users are available yet/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no audit events are available yet/i),
    ).toBeInTheDocument();
  });
});

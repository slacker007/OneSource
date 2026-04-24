import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { vi } from "vitest";

import { AdminUserDetail } from "./admin-user-detail";
import { AdminUserManagement } from "./admin-user-management";
import { INITIAL_ADMIN_USER_MANAGEMENT_ACTION_STATE } from "@/modules/admin/user-management-form.schema";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

describe("AdminUserManagement", () => {
  it("renders a dedicated user-management registry with grid filters and links to user workspaces", async () => {
    const user = userEvent.setup();

    render(
      <AdminUserManagement
        createUserAction={async () =>
          INITIAL_ADMIN_USER_MANAGEMENT_ACTION_STATE
        }
        sessionUser={{
          email: "admin@onesource.local",
          id: "user_admin",
          name: "Alex Morgan",
        }}
        snapshot={{
          organizationId: "org_123",
          organizationName: "Default Organization",
          totalUserCount: 3,
          activeUserCount: 1,
          invitedUserCount: 1,
          disabledUserCount: 1,
          adminUserCount: 1,
          roleOptions: [
            {
              key: "admin",
              label: "Admin",
              description: "Workspace administrators.",
            },
            {
              key: "executive",
              label: "Executive",
              description: "Executive reviewers.",
            },
          ],
          users: [
            {
              id: "user_admin",
              name: "Alex Morgan",
              email: "admin@onesource.local",
              status: "ACTIVE",
              latestRoleAssignedAt: "2026-04-22T12:00:00.000Z",
              roleKeys: ["admin"],
              roleLabels: ["Admin"],
              roles: [
                {
                  key: "admin",
                  label: "Admin",
                  assignedAt: "2026-04-22T12:00:00.000Z",
                },
              ],
            },
            {
              id: "user_invited",
              name: null,
              email: "new.user@onesource.local",
              status: "INVITED",
              latestRoleAssignedAt: null,
              roleKeys: [],
              roleLabels: [],
              roles: [],
            },
            {
              id: "user_disabled",
              name: "Avery Stone",
              email: "avery.stone@onesource.local",
              status: "DISABLED",
              latestRoleAssignedAt: "2026-04-20T09:00:00.000Z",
              roleKeys: ["executive"],
              roleLabels: ["Executive"],
              roles: [
                {
                  key: "executive",
                  label: "Executive",
                  assignedAt: "2026-04-20T09:00:00.000Z",
                },
              ],
            },
          ],
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /user administration/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/search users/i)).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /status filter/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /role filter/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("grid", { name: /workspace users/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /^manage$/i })[0],
    ).toHaveAttribute("href", "/settings/users/user_admin");

    await user.click(screen.getByRole("button", { name: /invite user/i }));
    expect(
      screen.getByRole("dialog", { name: /invite workspace user/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
  });

  it("renders a selected-user workspace with profile details and management actions", async () => {
    const user = userEvent.setup();

    render(
      <AdminUserDetail
        disableUserAction={async () =>
          INITIAL_ADMIN_USER_MANAGEMENT_ACTION_STATE
        }
        reactivateUserAction={async () =>
          INITIAL_ADMIN_USER_MANAGEMENT_ACTION_STATE
        }
        sessionUser={{
          email: "operator@onesource.local",
          id: "user_operator",
          name: "Operator",
        }}
        snapshot={{
          organizationId: "org_123",
          organizationName: "Default Organization",
          roleOptions: [
            {
              key: "admin",
              label: "Admin",
              description: "Workspace administrators.",
            },
            {
              key: "executive",
              label: "Executive",
              description: "Executive reviewers.",
            },
          ],
          recentAuditEvents: [
            {
              id: "audit_1",
              occurredAt: "2026-04-22T12:30:00.000Z",
              action: "workspace_user.roles.update",
              actionLabel: "Workspace User Roles Update",
              actorType: "USER",
              actorLabel: "Operator",
              targetLabel: "admin@onesource.local",
              targetType: "user",
              summary: "Updated role assignments for admin@onesource.local.",
              metadataJson: '{\n  "nextRoleKeys": [\n    "admin"\n  ]\n}',
              metadataPreview: '{"nextRoleKeys":["admin"]}',
            },
          ],
          user: {
            id: "user_admin",
            name: "Alex Morgan",
            email: "admin@onesource.local",
            status: "ACTIVE",
            latestRoleAssignedAt: "2026-04-22T12:00:00.000Z",
            roleKeys: ["admin"],
            roleLabels: ["Admin"],
            roles: [
              {
                key: "admin",
                label: "Admin",
                assignedAt: "2026-04-22T12:00:00.000Z",
              },
            ],
            activityCounts: {
              authoredNotes: 2,
              createdMilestones: 1,
              createdProposals: 1,
              createdSourceSearches: 3,
              createdTasks: 4,
              ownedProposals: 1,
              recentAuditEvents: 5,
              requestedSourceSyncRuns: 6,
              uploadedDocuments: 2,
            },
            createdAt: "2026-04-17T11:58:00.000Z",
            emailVerifiedAt: "2026-04-17T11:59:00.000Z",
            hasPassword: true,
            image: null,
            updatedAt: "2026-04-18T00:30:00.000Z",
          },
        }}
        updateUserRolesAction={async () =>
          INITIAL_ADMIN_USER_MANAGEMENT_ACTION_STATE
        }
      />,
    );

    expect(
      screen.getByRole("heading", { name: /alex morgan/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/user profile/i)).toBeInTheDocument();
    expect(screen.getAllByText(/apr 17, 2026/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/apr 22, 2026/i).length).toBeGreaterThan(0);
    expect(
      screen.queryByText(/2026-04-17T11:58:00.000Z/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/2026-04-22T12:30:00.000Z/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save roles/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("save-roles-button").tagName).toBe("BUTTON");
    expect(
      screen.getByRole("button", { name: /disable user/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/workspace user roles update/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("grid", { name: /user audit activity/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/nextRoleKeys/i)).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: /view metadata for workspace user roles update/i,
      }),
    );

    expect(screen.getByTestId("audit-metadata-panel")).toHaveTextContent(
      /nextRoleKeys/i,
    );
    expect(screen.getByText(/syncs requested/i)).toBeInTheDocument();
  });

  it("renders the selected-user audit empty state when no audit rows exist", () => {
    render(
      <AdminUserDetail
        disableUserAction={async () =>
          INITIAL_ADMIN_USER_MANAGEMENT_ACTION_STATE
        }
        reactivateUserAction={async () =>
          INITIAL_ADMIN_USER_MANAGEMENT_ACTION_STATE
        }
        sessionUser={{
          email: "operator@onesource.local",
          id: "user_operator",
          name: "Operator",
        }}
        snapshot={{
          organizationId: "org_123",
          organizationName: "Default Organization",
          roleOptions: [
            {
              key: "admin",
              label: "Admin",
              description: "Workspace administrators.",
            },
          ],
          recentAuditEvents: [],
          user: {
            id: "user_admin",
            name: "Alex Morgan",
            email: "admin@onesource.local",
            status: "ACTIVE",
            latestRoleAssignedAt: "2026-04-22T12:00:00.000Z",
            roleKeys: ["admin"],
            roleLabels: ["Admin"],
            roles: [
              {
                key: "admin",
                label: "Admin",
                assignedAt: "2026-04-22T12:00:00.000Z",
              },
            ],
            activityCounts: {
              authoredNotes: 0,
              createdMilestones: 0,
              createdProposals: 0,
              createdSourceSearches: 0,
              createdTasks: 0,
              ownedProposals: 0,
              recentAuditEvents: 0,
              requestedSourceSyncRuns: 0,
              uploadedDocuments: 0,
            },
            createdAt: "2026-04-17T11:58:00.000Z",
            emailVerifiedAt: null,
            hasPassword: false,
            image: null,
            updatedAt: "2026-04-18T00:30:00.000Z",
          },
        }}
        updateUserRolesAction={async () =>
          INITIAL_ADMIN_USER_MANAGEMENT_ACTION_STATE
        }
      />,
    );

    expect(
      screen.getByRole("heading", { name: /no recent audit events/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("grid", { name: /user audit activity/i }),
    ).not.toBeInTheDocument();
  });
});

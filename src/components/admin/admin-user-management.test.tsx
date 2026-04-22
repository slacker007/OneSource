import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { vi } from "vitest";

import { AdminUserManagement } from "./admin-user-management";
import { INITIAL_ADMIN_USER_MANAGEMENT_ACTION_STATE } from "@/modules/admin/user-management-form.schema";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

describe("AdminUserManagement", () => {
  it("renders a dedicated user-management workspace with grid filters and detail actions", async () => {
    const user = userEvent.setup();

    render(
      <AdminUserManagement
        createUserAction={async () => INITIAL_ADMIN_USER_MANAGEMENT_ACTION_STATE}
        disableUserAction={async () => INITIAL_ADMIN_USER_MANAGEMENT_ACTION_STATE}
        reactivateUserAction={async () => INITIAL_ADMIN_USER_MANAGEMENT_ACTION_STATE}
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
        updateUserRolesAction={async () => INITIAL_ADMIN_USER_MANAGEMENT_ACTION_STATE}
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
    expect(screen.getByRole("grid", { name: /workspace users/i })).toBeInTheDocument();
    expect(screen.getByText(/selected user/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /disable user/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /invite user/i }));
    expect(
      screen.getByRole("dialog", { name: /invite workspace user/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
  });
});

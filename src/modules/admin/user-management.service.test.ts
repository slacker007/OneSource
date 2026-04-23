import { AuditActorType, UserStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { AUDIT_ACTIONS } from "@/modules/audit/audit.service";
import {
  createInvitedWorkspaceUser,
  disableWorkspaceUser,
  reactivateWorkspaceUser,
  updateWorkspaceUserRoles,
  type UserManagementServiceClient,
} from "./user-management.service";

function createServiceClient() {
  const tx = {
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: "audit_123" }),
    },
    role: {
      findMany: vi.fn().mockResolvedValue([
        {
          description: "Workspace administrators.",
          id: "role_admin",
          key: "admin",
          name: "Admin",
        },
        {
          description: "Executive reviewers.",
          id: "role_executive",
          key: "executive",
          name: "Executive",
        },
      ]),
    },
    user: {
      create: vi.fn().mockResolvedValue({
        email: "new.user@onesource.local",
        id: "user_new",
        status: UserStatus.INVITED,
      }),
      findFirst: vi.fn(),
      update: vi.fn().mockResolvedValue({
        email: "morgan.patel@onesource.local",
        id: "user_capture",
        name: "Morgan Patel",
        status: UserStatus.DISABLED,
      }),
    },
    userRole: {
      createMany: vi.fn().mockResolvedValue({ count: 2 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };

  const db = {
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    $transaction: vi.fn(async (callback) => callback(tx)),
  } as unknown as UserManagementServiceClient;

  return { db, tx };
}

describe("user-management.service", () => {
  it("creates an invited workspace user and records an audit row", async () => {
    const { db, tx } = createServiceClient();
    const now = new Date("2026-04-22T18:10:00.000Z");

    const result = await createInvitedWorkspaceUser({
      db,
      input: {
        email: "NEW.USER@OneSource.Local",
        name: "New User",
        organizationId: "org_123",
        performedByUserId: "user_admin",
        roleKeys: ["admin", "executive"],
      },
      now,
    });

    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: {
        email: "new.user@onesource.local",
      },
      select: {
        id: true,
      },
    });
    expect(tx.user.create).toHaveBeenCalledWith({
      data: {
        email: "new.user@onesource.local",
        name: "New User",
        organizationId: "org_123",
        status: UserStatus.INVITED,
      },
      select: {
        email: true,
        id: true,
        status: true,
      },
    });
    expect(tx.userRole.createMany).toHaveBeenCalledWith({
      data: [
        {
          roleId: "role_admin",
          userId: "user_new",
        },
        {
          roleId: "role_executive",
          userId: "user_new",
        },
      ],
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: AUDIT_ACTIONS.workspaceUserCreate,
        actorType: AuditActorType.USER,
        actorUserId: "user_admin",
        occurredAt: now,
        organizationId: "org_123",
        summary: "Created an invited workspace user for new.user@onesource.local.",
        targetDisplay: "new.user@onesource.local",
        targetId: "user_new",
        targetType: "user",
      }),
    });
    expect(result).toEqual({
      email: "new.user@onesource.local",
      roleKeys: ["admin", "executive"],
      userId: "user_new",
    });
  });

  it("replaces existing role assignments and audits the delta", async () => {
    const { db, tx } = createServiceClient();
    const now = new Date("2026-04-22T18:12:00.000Z");

    vi.mocked(tx.user.findFirst).mockResolvedValue({
      email: "morgan.patel@onesource.local",
      id: "user_capture",
      name: "Morgan Patel",
      roles: [
        {
          role: {
            key: "capture_manager",
            name: "Capture Manager",
          },
        },
      ],
      status: UserStatus.ACTIVE,
    });

    const result = await updateWorkspaceUserRoles({
      db,
      input: {
        organizationId: "org_123",
        performedByUserId: "user_admin",
        roleKeys: ["admin", "executive"],
        userId: "user_capture",
      },
      now,
    });

    expect(tx.userRole.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: "user_capture",
      },
    });
    expect(tx.userRole.createMany).toHaveBeenCalledWith({
      data: [
        {
          roleId: "role_admin",
          userId: "user_capture",
        },
        {
          roleId: "role_executive",
          userId: "user_capture",
        },
      ],
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: AUDIT_ACTIONS.workspaceUserRolesUpdate,
        summary: "Updated role assignments for morgan.patel@onesource.local.",
        targetDisplay: "morgan.patel@onesource.local",
      }),
    });
    expect(result).toEqual({
      email: "morgan.patel@onesource.local",
      roleKeys: ["admin", "executive"],
      userId: "user_capture",
    });
  });

  it("disables a workspace user and records the status change", async () => {
    const { db, tx } = createServiceClient();
    const now = new Date("2026-04-22T18:14:00.000Z");

    vi.mocked(tx.user.findFirst).mockResolvedValue({
      email: "morgan.patel@onesource.local",
      id: "user_capture",
      name: "Morgan Patel",
      roles: [],
      status: UserStatus.ACTIVE,
    });

    const result = await disableWorkspaceUser({
      db,
      input: {
        organizationId: "org_123",
        performedByUserId: "user_admin",
        userId: "user_capture",
      },
      now,
    });

    expect(tx.user.update).toHaveBeenCalledWith({
      where: {
        id: "user_capture",
      },
      data: {
        status: UserStatus.DISABLED,
      },
      select: {
        email: true,
        id: true,
        name: true,
        status: true,
      },
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: AUDIT_ACTIONS.workspaceUserDisable,
        summary: "Disabled workspace access for morgan.patel@onesource.local.",
      }),
    });
    expect(result).toEqual({
      changed: true,
      email: "morgan.patel@onesource.local",
      status: UserStatus.DISABLED,
      userId: "user_capture",
    });
  });

  it("re-enables disabled users only", async () => {
    const { db, tx } = createServiceClient();
    const now = new Date("2026-04-22T18:16:00.000Z");

    vi.mocked(tx.user.findFirst).mockResolvedValue({
      email: "avery.stone@onesource.local",
      id: "user_viewer",
      name: "Avery Stone",
      roles: [],
      status: UserStatus.DISABLED,
    });
    vi.mocked(tx.user.update).mockResolvedValue({
      email: "avery.stone@onesource.local",
      id: "user_viewer",
      name: "Avery Stone",
      status: UserStatus.ACTIVE,
    });

    const result = await reactivateWorkspaceUser({
      db,
      input: {
        organizationId: "org_123",
        performedByUserId: "user_admin",
        userId: "user_viewer",
      },
      now,
    });

    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: AUDIT_ACTIONS.workspaceUserReactivate,
        summary: "Re-enabled workspace access for avery.stone@onesource.local.",
      }),
    });
    expect(result).toEqual({
      changed: true,
      email: "avery.stone@onesource.local",
      status: UserStatus.ACTIVE,
      userId: "user_viewer",
    });
  });

  it("prevents disabling the current operator", async () => {
    const { db } = createServiceClient();

    await expect(
      disableWorkspaceUser({
        db,
        input: {
          organizationId: "org_123",
          performedByUserId: "user_admin",
          userId: "user_admin",
        },
      }),
    ).rejects.toThrow(
      "Disable a different user from the one currently managing the workspace.",
    );
  });
});

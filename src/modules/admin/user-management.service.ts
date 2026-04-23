import { AuditActorType, Prisma, UserStatus, type PrismaClient } from "@prisma/client";

import { AUDIT_ACTIONS, recordAuditEvent } from "@/modules/audit/audit.service";

type OrganizationRoleRecord = {
  description: string | null;
  id: string;
  key: string;
  name: string;
};

type OrganizationUserRecord = {
  email: string;
  id: string;
  name: string | null;
  roles: Array<{
    role: {
      key: string;
      name: string;
    };
  }>;
  status: UserStatus;
};

type UserManagementTransactionClient = {
  auditLog: {
    create(args: {
      data: Prisma.AuditLogUncheckedCreateInput;
    }): Promise<unknown>;
  };
  role: {
    findMany(args: {
      where: {
        organizationId: string;
        key?: {
          in: string[];
        };
      };
      orderBy?: Prisma.RoleOrderByWithRelationInput | Prisma.RoleOrderByWithRelationInput[];
      select: {
        id: true;
        key: true;
        name: true;
        description: true;
      };
    }): Promise<OrganizationRoleRecord[]>;
  };
  user: {
    create(args: {
      data: Prisma.UserUncheckedCreateInput;
      select: {
        email: true;
        id: true;
        status: true;
      };
    }): Promise<{
      email: string;
      id: string;
      status: UserStatus;
    }>;
    findFirst(args: {
      where: {
        email?: string;
        id?: string;
        organizationId: string;
      };
      select: {
        email: true;
        id: true;
        name: true;
        status: true;
        roles: {
          select: {
            role: {
              select: {
                key: true;
                name: true;
              };
            };
          };
        };
      };
    }): Promise<OrganizationUserRecord | null>;
    update(args: {
      data: Prisma.UserUncheckedUpdateInput;
      select: {
        email: true;
        id: true;
        name: true;
        status: true;
      };
      where: {
        id: string;
      };
    }): Promise<{
      email: string;
      id: string;
      name: string | null;
      status: UserStatus;
    }>;
  };
  userRole: {
    createMany(args: {
      data: Array<{
        roleId: string;
        userId: string;
      }>;
    }): Promise<unknown>;
    deleteMany(args: {
      where: {
        userId: string;
      };
    }): Promise<unknown>;
  };
};

export type UserManagementServiceClient = Pick<PrismaClient, "$transaction"> & {
  user: {
    findUnique(args: {
      where: {
        email: string;
      };
      select: {
        id: true;
      };
    }): Promise<{ id: string } | null>;
  };
  $transaction<T>(
    callback: (tx: UserManagementTransactionClient) => Promise<T>,
  ): Promise<T>;
};

export type InviteWorkspaceUserInput = {
  email: string;
  name: string | null;
  organizationId: string;
  performedByUserId: string;
  roleKeys: string[];
};

export type UpdateWorkspaceUserRolesInput = {
  organizationId: string;
  performedByUserId: string;
  roleKeys: string[];
  userId: string;
};

export type SetWorkspaceUserStatusInput = {
  organizationId: string;
  performedByUserId: string;
  userId: string;
};

export async function createInvitedWorkspaceUser({
  db,
  input,
  now = new Date(),
}: {
  db: UserManagementServiceClient;
  input: InviteWorkspaceUserInput;
  now?: Date;
}) {
  const normalizedEmail = input.email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("An email address is required to invite a user.");
  }

  const existingUser = await db.user.findUnique({
    where: {
      email: normalizedEmail,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    throw new Error("A user with that email address already exists.");
  }

  return db.$transaction(async (tx) => {
    const roles = await resolveRoles({
      organizationId: input.organizationId,
      roleKeys: input.roleKeys,
      tx,
    });
    const createdUser = await tx.user.create({
      data: {
        email: normalizedEmail,
        name: input.name,
        organizationId: input.organizationId,
        status: UserStatus.INVITED,
      },
      select: {
        email: true,
        id: true,
        status: true,
      },
    });

    await tx.userRole.createMany({
      data: roles.map((role) => ({
        roleId: role.id,
        userId: createdUser.id,
      })),
    });

    await recordAuditEvent({
      db: tx,
      event: {
        action: AUDIT_ACTIONS.workspaceUserCreate,
        actor: {
          type: AuditActorType.USER,
          userId: input.performedByUserId,
        },
        metadata: {
          invitedStatus: createdUser.status,
          roleKeys: roles.map((role) => role.key),
          roleLabels: roles.map((role) => role.name),
        },
        occurredAt: now,
        organizationId: input.organizationId,
        summary: `Created an invited workspace user for ${createdUser.email}.`,
        target: {
          type: "user",
          id: createdUser.id,
          display: createdUser.email,
        },
      },
    });

    return {
      email: createdUser.email,
      roleKeys: roles.map((role) => role.key),
      userId: createdUser.id,
    };
  });
}

export async function updateWorkspaceUserRoles({
  db,
  input,
  now = new Date(),
}: {
  db: UserManagementServiceClient;
  input: UpdateWorkspaceUserRolesInput;
  now?: Date;
}) {
  return db.$transaction(async (tx) => {
    const existingUser = await findWorkspaceUser({
      organizationId: input.organizationId,
      tx,
      userId: input.userId,
    });
    const roles = await resolveRoles({
      organizationId: input.organizationId,
      roleKeys: input.roleKeys,
      tx,
    });
    const previousRoleKeys = existingUser.roles.map(({ role }) => role.key);

    await tx.userRole.deleteMany({
      where: {
        userId: existingUser.id,
      },
    });
    await tx.userRole.createMany({
      data: roles.map((role) => ({
        roleId: role.id,
        userId: existingUser.id,
      })),
    });

    await recordAuditEvent({
      db: tx,
      event: {
        action: AUDIT_ACTIONS.workspaceUserRolesUpdate,
        actor: {
          type: AuditActorType.USER,
          userId: input.performedByUserId,
        },
        metadata: {
          nextRoleKeys: roles.map((role) => role.key),
          nextRoleLabels: roles.map((role) => role.name),
          previousRoleKeys,
        },
        occurredAt: now,
        organizationId: input.organizationId,
        summary: `Updated role assignments for ${existingUser.email}.`,
        target: {
          type: "user",
          id: existingUser.id,
          display: existingUser.email,
        },
      },
    });

    return {
      email: existingUser.email,
      roleKeys: roles.map((role) => role.key),
      userId: existingUser.id,
    };
  });
}

export async function disableWorkspaceUser({
  db,
  input,
  now = new Date(),
}: {
  db: UserManagementServiceClient;
  input: SetWorkspaceUserStatusInput;
  now?: Date;
}) {
  if (input.userId === input.performedByUserId) {
    throw new Error("Disable a different user from the one currently managing the workspace.");
  }

  return setWorkspaceUserStatus({
    action: AUDIT_ACTIONS.workspaceUserDisable,
    db,
    input,
    nextStatus: UserStatus.DISABLED,
    now,
    summaryPrefix: "Disabled workspace access for",
  });
}

export async function reactivateWorkspaceUser({
  db,
  input,
  now = new Date(),
}: {
  db: UserManagementServiceClient;
  input: SetWorkspaceUserStatusInput;
  now?: Date;
}) {
  return setWorkspaceUserStatus({
    action: AUDIT_ACTIONS.workspaceUserReactivate,
    db,
    input,
    nextStatus: UserStatus.ACTIVE,
    now,
    summaryPrefix: "Re-enabled workspace access for",
  });
}

async function setWorkspaceUserStatus({
  action,
  db,
  input,
  nextStatus,
  now,
  summaryPrefix,
}: {
  action: string;
  db: UserManagementServiceClient;
  input: SetWorkspaceUserStatusInput;
  nextStatus: UserStatus;
  now: Date;
  summaryPrefix: string;
}) {
  return db.$transaction(async (tx) => {
    const existingUser = await findWorkspaceUser({
      organizationId: input.organizationId,
      tx,
      userId: input.userId,
    });

    if (existingUser.status === nextStatus) {
      return {
        changed: false,
        email: existingUser.email,
        status: existingUser.status,
        userId: existingUser.id,
      };
    }

    if (nextStatus === UserStatus.ACTIVE && existingUser.status !== UserStatus.DISABLED) {
      throw new Error("Only disabled users can be re-enabled from this workspace.");
    }

    const updatedUser = await tx.user.update({
      where: {
        id: existingUser.id,
      },
      data: {
        status: nextStatus,
      },
      select: {
        email: true,
        id: true,
        name: true,
        status: true,
      },
    });

    await recordAuditEvent({
      db: tx,
      event: {
        action,
        actor: {
          type: AuditActorType.USER,
          userId: input.performedByUserId,
        },
        metadata: {
          nextStatus,
          previousStatus: existingUser.status,
        },
        occurredAt: now,
        organizationId: input.organizationId,
        summary: `${summaryPrefix} ${updatedUser.email}.`,
        target: {
          type: "user",
          id: updatedUser.id,
          display: updatedUser.email,
        },
      },
    });

    return {
      changed: true,
      email: updatedUser.email,
      status: updatedUser.status,
      userId: updatedUser.id,
    };
  });
}

async function findWorkspaceUser({
  organizationId,
  tx,
  userId,
}: {
  organizationId: string;
  tx: UserManagementTransactionClient;
  userId: string;
}) {
  const existingUser = await tx.user.findFirst({
    where: {
      id: userId,
      organizationId,
    },
    select: {
      email: true,
      id: true,
      name: true,
      status: true,
      roles: {
        select: {
          role: {
            select: {
              key: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!existingUser) {
    throw new Error("The selected workspace user could not be found.");
  }

  return existingUser;
}

async function resolveRoles({
  organizationId,
  roleKeys,
  tx,
}: {
  organizationId: string;
  roleKeys: string[];
  tx: UserManagementTransactionClient;
}) {
  const uniqueRoleKeys = [...new Set(roleKeys)];

  if (uniqueRoleKeys.length === 0) {
    throw new Error("Assign at least one valid role.");
  }

  const roles = await tx.role.findMany({
    where: {
      key: {
        in: uniqueRoleKeys,
      },
      organizationId,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
    },
  });

  if (roles.length !== uniqueRoleKeys.length) {
    throw new Error("One or more role assignments are invalid for this workspace.");
  }

  return roles;
}

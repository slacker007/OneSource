import {
  AuditActorType,
  OrganizationStatus,
  PrismaClient,
  UserStatus,
} from "@prisma/client";

import { SYSTEM_ROLE_DEFINITIONS } from "./system-roles.mjs";

const prisma = new PrismaClient();

async function main() {
  const organization = await prisma.organization.upsert({
    where: { slug: "default-org" },
    update: {
      name: "Default Organization",
      status: OrganizationStatus.ACTIVE,
    },
    create: {
      slug: "default-org",
      name: "Default Organization",
      status: OrganizationStatus.ACTIVE,
    },
  });

  for (const role of SYSTEM_ROLE_DEFINITIONS) {
    await prisma.role.upsert({
      where: {
        organizationId_key: {
          organizationId: organization.id,
          key: role.key,
        },
      },
      update: {
        name: role.name,
        description: role.description,
        isSystem: true,
      },
      create: {
        organizationId: organization.id,
        key: role.key,
        name: role.name,
        description: role.description,
        isSystem: true,
      },
    });
  }

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@onesource.local" },
    update: {
      organizationId: organization.id,
      name: "OneSource Admin",
      status: UserStatus.ACTIVE,
    },
    create: {
      organizationId: organization.id,
      email: "admin@onesource.local",
      name: "OneSource Admin",
      status: UserStatus.ACTIVE,
    },
  });

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: {
      organizationId_key: {
        organizationId: organization.id,
        key: "admin",
      },
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: organization.id,
      actorUserId: adminUser.id,
      actorType: AuditActorType.USER,
      actorIdentifier: adminUser.email,
      action: "seed.bootstrap",
      targetType: "organization",
      targetId: organization.id,
      targetDisplay: organization.name,
      summary: "Initialized baseline organization, roles, and admin seed data.",
      metadata: {
        roleKeys: SYSTEM_ROLE_DEFINITIONS.map((role) => role.key),
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

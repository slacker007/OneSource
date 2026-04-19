import { verifyPasswordHash } from "./password";

type AuthUserRecord = {
  id: string;
  organizationId: string;
  email: string;
  name: string | null;
  passwordHash: string | null;
  status: "ACTIVE" | "INVITED" | "DISABLED";
  roles: Array<{
    role: {
      key: string;
    };
  }>;
};

export type AuthenticatedSessionUser = {
  id: string;
  organizationId: string;
  email: string;
  name: string | null;
  roleKeys: string[];
};

export type CredentialsInput = {
  email?: string;
  password?: string;
};

export interface AuthUserStore {
  findByEmail(email: string): Promise<AuthUserRecord | null>;
  findById(userId: string): Promise<AuthUserRecord | null>;
}

async function createPrismaAuthUserStore(): Promise<AuthUserStore> {
  const { prisma } = await import("../prisma");

  return {
    async findByEmail(email) {
      return prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          organizationId: true,
          email: true,
          name: true,
          passwordHash: true,
          status: true,
          roles: {
            select: {
              role: {
                select: {
                  key: true,
                },
              },
            },
          },
        },
      });
    },
    async findById(userId) {
      return prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          organizationId: true,
          email: true,
          name: true,
          passwordHash: true,
          status: true,
          roles: {
            select: {
              role: {
                select: {
                  key: true,
                },
              },
            },
          },
        },
      });
    },
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function buildAuthenticatedSessionUser(
  user: Pick<
    AuthUserRecord,
    "id" | "organizationId" | "email" | "name" | "roles" | "status"
  > | null,
): AuthenticatedSessionUser | null {
  if (!user || user.status !== "ACTIVE") {
    return null;
  }

  return {
    id: user.id,
    organizationId: user.organizationId,
    email: user.email,
    name: user.name,
    roleKeys: [...new Set(user.roles.map(({ role }) => role.key))],
  };
}

export async function authenticateUserWithPassword(
  credentials: CredentialsInput,
  store?: AuthUserStore,
): Promise<AuthenticatedSessionUser | null> {
  const email = credentials.email ? normalizeEmail(credentials.email) : "";
  const password = credentials.password?.trim() ?? "";

  if (!email || !password) {
    return null;
  }

  const resolvedStore = store ?? (await createPrismaAuthUserStore());
  const user = await resolvedStore.findByEmail(email);

  if (
    !user ||
    user.status !== "ACTIVE" ||
    !verifyPasswordHash(password, user.passwordHash)
  ) {
    return null;
  }

  return buildAuthenticatedSessionUser(user);
}

export async function getCurrentAuthenticatedUser(
  userId: string,
  store?: AuthUserStore,
): Promise<AuthenticatedSessionUser | null> {
  if (!userId.trim()) {
    return null;
  }

  const resolvedStore = store ?? (await createPrismaAuthUserStore());
  const user = await resolvedStore.findById(userId);

  return buildAuthenticatedSessionUser(user);
}

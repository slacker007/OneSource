import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      organizationId: string;
      roleKeys: string[];
    };
  }

  interface User extends DefaultUser {
    id: string;
    organizationId: string;
    roleKeys: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    organizationId?: string;
    roleKeys?: string[];
  }
}

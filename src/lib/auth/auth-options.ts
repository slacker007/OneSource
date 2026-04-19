import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";

import {
  authenticateUserWithPassword,
  getCurrentAuthenticatedUser,
} from "./authenticate-user";

type SessionTokenUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  organizationId: string;
  roleKeys: string[];
};

function applyUserToToken(token: JWT, user: SessionTokenUser) {
  token.sub = user.id;
  token.email = user.email ?? null;
  token.name = user.name ?? null;
  token.organizationId = user.organizationId;
  token.roleKeys = user.roleKeys;
  return token;
}

function clearAppTokenFields(token: JWT) {
  delete token.sub;
  delete token.email;
  delete token.name;
  delete token.organizationId;
  delete token.roleKeys;
  return token;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
  },
  providers: [
    CredentialsProvider({
      name: "OneSource Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        return authenticateUserWithPassword(credentials ?? {});
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return applyUserToToken(token, user);
      }

      if (typeof token.sub === "string") {
        const currentUser = await getCurrentAuthenticatedUser(token.sub);

        if (!currentUser) {
          return clearAppTokenFields(token);
        }

        return applyUserToToken(token, currentUser);
      }

      return token;
    },
    async session({ session, token }) {
      if (!session.user || !token.sub || typeof token.organizationId !== "string") {
        return session;
      }

      session.user.id = token.sub;
      session.user.organizationId = token.organizationId;
      session.user.roleKeys = Array.isArray(token.roleKeys)
        ? token.roleKeys.filter((role): role is string => typeof role === "string")
        : [];
      session.user.email =
        typeof token.email === "string" ? token.email : session.user.email;
      session.user.name =
        typeof token.name === "string" ? token.name : session.user.name;

      return session;
    },
  },
};

export function getServerAuthSession() {
  return getServerSession(authOptions);
}

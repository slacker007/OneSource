import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";

import { authenticateUserWithPassword } from "./authenticate-user";

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
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.organizationId = user.organizationId;
        token.roleKeys = user.roleKeys;
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

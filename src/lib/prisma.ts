import { PrismaClient } from "@prisma/client";

declare global {
  var __onesourcePrisma__: PrismaClient | undefined;
}

export function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalThis.__onesourcePrisma__ ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__onesourcePrisma__ = prisma;
}

import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required.")
    .refine((value) => {
      try {
        const protocol = new URL(value).protocol;
        return protocol === "postgres:" || protocol === "postgresql:";
      } catch {
        return false;
      }
    }, "DATABASE_URL must be a valid postgres connection string."),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  WORKER_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(30000),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedServerEnv: ServerEnv | null = null;

export function parseServerEnv(input: Record<string, string | undefined>) {
  return serverEnvSchema.parse(input);
}

export function getServerEnv() {
  if (!cachedServerEnv) {
    cachedServerEnv = parseServerEnv(process.env);
  }

  return cachedServerEnv;
}

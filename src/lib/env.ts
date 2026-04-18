import { z } from "zod";

const booleanishSchema = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["1", "true", "yes", "on"].includes(normalized)) {
      return true;
    }

    if (["0", "false", "no", "off", ""].includes(normalized)) {
      return false;
    }
  }

  return value;
}, z.boolean());

const serverEnvSchema = z.object({
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters long."),
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
  NEXTAUTH_URL: z.url("NEXTAUTH_URL must be a valid absolute URL."),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DOCUMENT_UPLOAD_DIR: z
    .string()
    .trim()
    .min(1, "DOCUMENT_UPLOAD_DIR must not be empty.")
    .default(".data/opportunity-documents"),
  SAM_GOV_API_KEY: z
    .preprocess((value) => {
      if (typeof value !== "string") {
        return value;
      }

      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }, z
    .string()
    .trim()
    .min(1, "SAM_GOV_API_KEY must not be empty when set.")
    .optional()),
  SAM_GOV_SEARCH_ENDPOINT: z
    .string()
    .url("SAM_GOV_SEARCH_ENDPOINT must be a valid absolute URL.")
    .default("https://api.sam.gov/prod/opportunities/v2/search"),
  SAM_GOV_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  SAM_GOV_USE_FIXTURES: booleanishSchema.default(false),
  WORKER_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(30000),
  DEADLINE_REMINDER_LOOKAHEAD_DAYS: z.coerce
    .number()
    .int()
    .positive()
    .default(7),
  SOURCE_SYNC_INTERVAL_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .default(1440),
  SOURCE_SYNC_BATCH_SIZE: z.coerce.number().int().positive().default(3),
  DOCUMENT_PARSER_BATCH_SIZE: z.coerce.number().int().positive().default(10),
  DOCUMENT_PARSER_MAX_ATTEMPTS: z.coerce.number().int().positive().default(3),
  OPPORTUNITY_SCORECARD_BATCH_SIZE: z.coerce
    .number()
    .int()
    .positive()
    .default(10),
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

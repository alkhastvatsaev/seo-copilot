import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  value === "" || value === undefined || value === null ? undefined : value;

const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.url(),
  AUTH_SECRET: z.string().min(32),
  OPENAI_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  GOOGLE_CLIENT_ID: z.preprocess(emptyToUndefined, z.string().optional()),
  GOOGLE_CLIENT_SECRET: z.preprocess(emptyToUndefined, z.string().optional()),
  GEMINI_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  SENTRY_DSN: z.preprocess(emptyToUndefined, z.url().optional()),
  INNGEST_EVENT_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  INNGEST_SIGNING_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
});

export type ServerEnv = z.infer<typeof serverSchema>;

function loadServerEnv(): ServerEnv {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment: ${message}`);
  }
  return parsed.data;
}

export const env = loadServerEnv();

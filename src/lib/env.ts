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
  AUDIT_STORE: z.preprocess(
    emptyToUndefined,
    z.enum(["memory", "postgres"]).optional(),
  ),
  TRUST_PROXY: z.preprocess(emptyToUndefined, z.enum(["0", "1"]).optional()),
  /** Classic Upstash names — optional aliases of Vercel marketplace KV_* */
  UPSTASH_REDIS_REST_URL: z.preprocess(
    emptyToUndefined,
    z.url().optional(),
  ),
  UPSTASH_REDIS_REST_TOKEN: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),
  /** Vercel Marketplace Upstash Redis injects these */
  KV_REST_API_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  KV_REST_API_TOKEN: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),
});

export type ServerEnv = z.infer<typeof serverSchema>;

/** Resolved Redis REST credentials (UPSTASH_* or Vercel KV_*). */
export function getUpstashRedisCredentials(
  values: Pick<
    ServerEnv,
    | "UPSTASH_REDIS_REST_URL"
    | "UPSTASH_REDIS_REST_TOKEN"
    | "KV_REST_API_URL"
    | "KV_REST_API_TOKEN"
  > = env,
): { url: string; token: string } | null {
  const url = values.UPSTASH_REDIS_REST_URL ?? values.KV_REST_API_URL;
  const token = values.UPSTASH_REDIS_REST_TOKEN ?? values.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

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

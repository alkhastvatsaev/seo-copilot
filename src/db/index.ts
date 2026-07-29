import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

let client: ReturnType<typeof postgres> | undefined;

export function getDb() {
  if (!client) {
    client = postgres(env.DATABASE_URL, { max: 10 });
  }
  return drizzle(client, { schema });
}

export type Db = ReturnType<typeof getDb>;

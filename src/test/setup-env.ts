if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://postgres:postgres@localhost:5432/seo_copilot_test";
}

if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = "development-secret-min-32-characters-long";
}

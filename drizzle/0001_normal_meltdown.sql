ALTER TABLE "audit" ADD COLUMN "score" integer;--> statement-breakpoint
ALTER TABLE "audit" ADD COLUMN "issues" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "audit" ADD COLUMN "errorMessage" text;--> statement-breakpoint
ALTER TABLE "audit" ADD COLUMN "completedAt" timestamp;
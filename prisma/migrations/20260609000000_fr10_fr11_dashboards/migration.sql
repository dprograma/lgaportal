-- FR-10 / FR-11: Admin Analytics, User Management & Chairman Dashboard

-- ── 1. Post: scheduling + view tracking ───────────────────────────────────────
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP(3);
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "viewCount"   INTEGER NOT NULL DEFAULT 0;

-- Update publishedAt for already-published posts
UPDATE "posts" SET "publishedAt" = "createdAt" WHERE "status" = 'PUBLISHED' AND "publishedAt" IS NULL;

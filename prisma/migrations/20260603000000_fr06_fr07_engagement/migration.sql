-- FR-06 / FR-07: LGA Project Showcase + Public Engagement & Transparency

-- ── 1. Extend enums ────────────────────────────────────────────────────────────
ALTER TYPE "ReactionType" ADD VALUE IF NOT EXISTS 'SUPPORT';
ALTER TYPE "ReactionType" ADD VALUE IF NOT EXISTS 'QUESTION';
ALTER TYPE "ReactionType" ADD VALUE IF NOT EXISTS 'REPORT';
ALTER TYPE "FlagReason"   ADD VALUE IF NOT EXISTS 'MISLEADING';

-- ── 2. User: add suspendedUntil ────────────────────────────────────────────────
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspendedUntil" TIMESTAMP(3);

-- ── 3. Project: new fields ─────────────────────────────────────────────────────
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "slug"             TEXT;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "approvalStatus"   TEXT NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "submittedByStaff" TEXT;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "shareCount"       INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "reportCount"      INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS "projects_slug_key" ON "projects"("slug");

-- ── 4. Reaction: make postId optional, add projectId ──────────────────────────
ALTER TABLE "reactions" ALTER COLUMN "postId" DROP NOT NULL;
ALTER TABLE "reactions" ADD COLUMN IF NOT EXISTS "projectId" TEXT;

ALTER TABLE "reactions"
  ADD CONSTRAINT "reactions_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id")
  ON DELETE CASCADE ON UPDATE CASCADE
  NOT VALID;
ALTER TABLE "reactions" VALIDATE CONSTRAINT "reactions_projectId_fkey";

-- Drop old hard unique, replace with partial indexes
ALTER TABLE "reactions" DROP CONSTRAINT IF EXISTS "reactions_postId_userId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "reactions_post_user_uidx"    ON "reactions"("postId",    "userId") WHERE "postId"    IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "reactions_project_user_uidx" ON "reactions"("projectId", "userId") WHERE "projectId" IS NOT NULL;

-- ── 5. Comment: make postId optional, add projectId/parentId/editedAt/modStatus
ALTER TABLE "comments" ALTER COLUMN "postId" DROP NOT NULL;
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "projectId" TEXT;
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "parentId"  TEXT;
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "editedAt"  TIMESTAMP(3);
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "modStatus" TEXT NOT NULL DEFAULT 'APPROVED';

ALTER TABLE "comments"
  ADD CONSTRAINT "comments_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id")
  ON DELETE CASCADE ON UPDATE CASCADE
  NOT VALID;
ALTER TABLE "comments" VALIDATE CONSTRAINT "comments_projectId_fkey";

ALTER TABLE "comments"
  ADD CONSTRAINT "comments_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "comments"("id")
  ON DELETE SET NULL ON UPDATE CASCADE
  NOT VALID;
ALTER TABLE "comments" VALIDATE CONSTRAINT "comments_parentId_fkey";

-- ── 6. FlagReport: polymorphic support ────────────────────────────────────────
ALTER TABLE "flag_reports" ALTER COLUMN "postId" DROP NOT NULL;
ALTER TABLE "flag_reports" ADD COLUMN IF NOT EXISTS "projectId"   TEXT;
ALTER TABLE "flag_reports" ADD COLUMN IF NOT EXISTS "commentId"   TEXT;
ALTER TABLE "flag_reports" ADD COLUMN IF NOT EXISTS "contentType" TEXT NOT NULL DEFAULT 'post';
ALTER TABLE "flag_reports" ADD COLUMN IF NOT EXISTS "status"      TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "flag_reports" ADD COLUMN IF NOT EXISTS "resolvedAt"  TIMESTAMP(3);
ALTER TABLE "flag_reports" ADD COLUMN IF NOT EXISTS "resolvedBy"  TEXT;

ALTER TABLE "flag_reports"
  ADD CONSTRAINT "flag_reports_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id")
  ON DELETE CASCADE ON UPDATE CASCADE
  NOT VALID;
ALTER TABLE "flag_reports" VALIDATE CONSTRAINT "flag_reports_projectId_fkey";

ALTER TABLE "flag_reports" DROP CONSTRAINT IF EXISTS "flag_reports_postId_userId_key";

-- ── 7. ModerationAction table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "moderation_actions" (
  "id"         TEXT         NOT NULL,
  "adminId"    TEXT         NOT NULL,
  "targetType" TEXT         NOT NULL,
  "targetId"   TEXT         NOT NULL,
  "action"     TEXT         NOT NULL,
  "reason"     TEXT         NOT NULL,
  "duration"   INTEGER,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "moderation_actions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "moderation_actions"
  ADD CONSTRAINT "moderation_actions_adminId_fkey"
  FOREIGN KEY ("adminId") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE
  NOT VALID;

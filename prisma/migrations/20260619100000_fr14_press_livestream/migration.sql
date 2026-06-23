-- FR-14: News & Press Integration
-- Add EntityType, PressStatus, StreamStatus enums + press_releases + live_streams tables

DO $$ BEGIN
  CREATE TYPE "EntityType" AS ENUM ('LGA', 'STATE', 'FEDERAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PressStatus" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED', 'DRAFT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "StreamStatus" AS ENUM ('UPCOMING', 'LIVE', 'ENDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "press_releases" (
  "id"               TEXT         NOT NULL,
  "title"            TEXT         NOT NULL,
  "body"             TEXT         NOT NULL,
  "issuingEntity"    TEXT         NOT NULL,
  "entityType"       "EntityType" NOT NULL DEFAULT 'LGA',
  "lgaId"            TEXT,
  "dateIssued"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "attachmentUrl"    TEXT,
  "status"           "PressStatus" NOT NULL DEFAULT 'DRAFT',
  "submittedByRole"  TEXT,
  "submittedByLgaId" TEXT,
  "approvedAt"       TIMESTAMP(3),
  "rejectedReason"   TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "press_releases_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "press_releases"
    ADD CONSTRAINT "press_releases_lgaId_fkey"
    FOREIGN KEY ("lgaId") REFERENCES "lgas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "press_releases_status_idx"     ON "press_releases"("status");
CREATE INDEX IF NOT EXISTS "press_releases_lgaId_idx"      ON "press_releases"("lgaId");
CREATE INDEX IF NOT EXISTS "press_releases_entityType_idx" ON "press_releases"("entityType");

CREATE TABLE IF NOT EXISTS "live_streams" (
  "id"          TEXT          NOT NULL,
  "lgaId"       TEXT,
  "title"       TEXT          NOT NULL,
  "description" TEXT,
  "streamUrl"   TEXT          NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "status"      "StreamStatus" NOT NULL DEFAULT 'UPCOMING',
  "createdBy"   TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "live_streams_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "live_streams"
    ADD CONSTRAINT "live_streams_lgaId_fkey"
    FOREIGN KEY ("lgaId") REFERENCES "lgas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "live_streams_status_idx"      ON "live_streams"("status");
CREATE INDEX IF NOT EXISTS "live_streams_scheduledAt_idx" ON "live_streams"("scheduledAt");

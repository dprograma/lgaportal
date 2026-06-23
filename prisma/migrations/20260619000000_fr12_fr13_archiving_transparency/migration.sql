-- FR-12 / FR-13: Data Management, Archiving & Government Transparency

-- ── 1. Link posts to chairman tenure ──────────────────────────────────────────
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "tenureId" TEXT;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'posts_tenureId_fkey' AND table_name = 'posts'
  ) THEN
    ALTER TABLE "posts"
      ADD CONSTRAINT "posts_tenureId_fkey"
      FOREIGN KEY ("tenureId") REFERENCES "lga_tenures"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ── 2. Procurement contracts (FR-13-02) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS "procurement_contracts" (
  "id"          TEXT         NOT NULL,
  "lgaId"       TEXT         NOT NULL,
  "title"       TEXT         NOT NULL,
  "contractor"  TEXT         NOT NULL,
  "value"       BIGINT       NOT NULL,
  "awardDate"   TIMESTAMP(3) NOT NULL,
  "scope"       TEXT         NOT NULL,
  "source"      TEXT,
  "isPublished" BOOLEAN      NOT NULL DEFAULT TRUE,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "procurement_contracts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "procurement_contracts_lgaId_fkey"
    FOREIGN KEY ("lgaId") REFERENCES "lgas"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "procurement_contracts_lgaId_idx" ON "procurement_contracts"("lgaId");

-- ── 3. Audit reports (FR-13-03) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "audit_reports" (
  "id"            TEXT         NOT NULL,
  "lgaId"         TEXT         NOT NULL,
  "financialYear" INTEGER      NOT NULL,
  "title"         TEXT         NOT NULL,
  "auditingBody"  TEXT         NOT NULL,
  "reportUrl"     TEXT         NOT NULL,
  "isPublished"   BOOLEAN      NOT NULL DEFAULT TRUE,
  "uploadedBy"    TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "audit_reports_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "audit_reports_lgaId_fkey"
    FOREIGN KEY ("lgaId") REFERENCES "lgas"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "audit_reports_lgaId_idx"         ON "audit_reports"("lgaId");
CREATE INDEX IF NOT EXISTS "audit_reports_financialYear_idx"  ON "audit_reports"("financialYear");

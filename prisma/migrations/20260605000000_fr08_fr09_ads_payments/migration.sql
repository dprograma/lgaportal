-- FR-08 / FR-09: Advertising System & Payments

-- ── 1. User: advertiser profile fields ────────────────────────────────────────
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "advertiserCompany" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "advertiserPhone"   TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "advertiserWebsite" TEXT;

-- ── 2. AdPlan ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ad_plans" (
  "id"             TEXT         NOT NULL,
  "name"           TEXT         NOT NULL,
  "description"    TEXT         NOT NULL DEFAULT '',
  "price"          BIGINT       NOT NULL,
  "durationDays"   INTEGER      NOT NULL,
  "formats"        TEXT[]       NOT NULL DEFAULT '{}',
  "placements"     TEXT[]       NOT NULL DEFAULT '{}',
  "maxImpressions" INTEGER,
  "isActive"       BOOLEAN      NOT NULL DEFAULT true,
  "sortOrder"      INTEGER      NOT NULL DEFAULT 0,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ad_plans_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ad_plans_name_key" ON "ad_plans"("name");

-- ── 3. AdCampaign ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ad_campaigns" (
  "id"              TEXT         NOT NULL,
  "advertiserId"    TEXT         NOT NULL,
  "planId"          TEXT         NOT NULL,
  "title"           TEXT         NOT NULL,
  "description"     TEXT,
  "format"          TEXT         NOT NULL,
  "placement"       TEXT         NOT NULL,
  "creativeUrl"     TEXT,
  "linkUrl"         TEXT         NOT NULL DEFAULT '',
  "status"          TEXT         NOT NULL DEFAULT 'PENDING_REVIEW',
  "impressions"     INTEGER      NOT NULL DEFAULT 0,
  "clicks"          INTEGER      NOT NULL DEFAULT 0,
  "startDate"       TIMESTAMP(3),
  "endDate"         TIMESTAMP(3),
  "rejectionReason" TEXT,
  "paystackRef"     TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ad_campaigns_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ad_campaigns"
  ADD CONSTRAINT "ad_campaigns_advertiserId_fkey"
  FOREIGN KEY ("advertiserId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;

ALTER TABLE "ad_campaigns"
  ADD CONSTRAINT "ad_campaigns_planId_fkey"
  FOREIGN KEY ("planId") REFERENCES "ad_plans"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- ── 4. AdImpression ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ad_impressions" (
  "id"         TEXT         NOT NULL,
  "campaignId" TEXT         NOT NULL,
  "ip"         TEXT,
  "userAgent"  TEXT,
  "pageUrl"    TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ad_impressions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ad_impressions"
  ADD CONSTRAINT "ad_impressions_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "ad_campaigns"("id")
  ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;

-- ── 5. Transaction ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "transactions" (
  "id"            TEXT         NOT NULL,
  "userId"        TEXT,
  "lgaId"         TEXT,
  "campaignId"    TEXT,
  "amount"        BIGINT       NOT NULL,
  "purpose"       TEXT         NOT NULL,
  "status"        TEXT         NOT NULL DEFAULT 'PENDING',
  "paystackRef"   TEXT,
  "paystackData"  JSONB,
  "invoiceNumber" TEXT,
  "invoiceUrl"    TEXT,
  "metadata"      JSONB,
  "paidAt"        TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "transactions_paystackRef_key"   ON "transactions"("paystackRef")   WHERE "paystackRef"   IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "transactions_invoiceNumber_key" ON "transactions"("invoiceNumber") WHERE "invoiceNumber" IS NOT NULL;

-- ── 6. Invoice number sequence ────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1;

-- ── 7. EmailNotificationLog ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "email_notification_logs" (
  "id"        TEXT         NOT NULL,
  "to"        TEXT         NOT NULL,
  "subject"   TEXT         NOT NULL,
  "purpose"   TEXT         NOT NULL,
  "status"    TEXT         NOT NULL DEFAULT 'SENT',
  "attempts"  INTEGER      NOT NULL DEFAULT 1,
  "error"     TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_notification_logs_pkey" PRIMARY KEY ("id")
);

-- ── 8. Seed default ad plans ──────────────────────────────────────────────────
INSERT INTO "ad_plans" ("id","name","description","price","durationDays","formats","placements","maxImpressions","isActive","sortOrder","updatedAt")
VALUES
  ('adplan-basic',    'Basic',    'Great for getting started. Banner ad on select pages.', 5000000, 30,
   ARRAY['BANNER'], ARRAY['HOMEPAGE_BOTTOM','LGA_SIDEBAR'], 50000, true, 1, CURRENT_TIMESTAMP),
  ('adplan-standard', 'Standard', 'More visibility. Sidebar + Sponsored posts in the news feed.', 15000000, 30,
   ARRAY['BANNER','SIDEBAR','SPONSORED'], ARRAY['HOMEPAGE_TOP','HOMEPAGE_BOTTOM','LGA_SIDEBAR','NEWS_FEED'], 200000, true, 2, CURRENT_TIMESTAMP),
  ('adplan-premium',  'Premium',  'Maximum exposure across the entire platform including featured listings.', 35000000, 30,
   ARRAY['BANNER','SIDEBAR','SPONSORED','FEATURED'], ARRAY['HOMEPAGE_TOP','HOMEPAGE_BOTTOM','LGA_SIDEBAR','NEWS_FEED','FEATURED_LGA'], NULL, true, 3, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

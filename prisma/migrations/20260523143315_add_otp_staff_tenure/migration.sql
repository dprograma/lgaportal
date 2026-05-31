-- CreateEnum
CREATE TYPE "OTPPurpose" AS ENUM ('CITIZEN_LOGIN', 'LGA_LOGIN', 'REGISTER', 'SENSITIVE');

-- AlterTable
ALTER TABLE "lgas" ADD COLUMN     "gracePeriodEndsAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionStatus" TEXT,
ADD COLUMN     "tenureEndDate" TIMESTAMP(3),
ADD COLUMN     "tenureStartDate" TIMESTAMP(3),
ADD COLUMN     "tenureStatus" TEXT NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "purpose" "OTPPurpose" NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lga_staff" (
    "id" TEXT NOT NULL,
    "lgaId" TEXT NOT NULL,
    "chairmanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "password" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "canPublish" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lga_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lga_tenures" (
    "id" TEXT NOT NULL,
    "lgaId" TEXT NOT NULL,
    "chairmanName" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "reElectionDoc" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lga_tenures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otp_codes_identifier_purpose_idx" ON "otp_codes"("identifier", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "lga_staff_email_key" ON "lga_staff"("email");

-- AddForeignKey
ALTER TABLE "lga_staff" ADD CONSTRAINT "lga_staff_lgaId_fkey" FOREIGN KEY ("lgaId") REFERENCES "lgas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lga_staff" ADD CONSTRAINT "lga_staff_chairmanId_fkey" FOREIGN KEY ("chairmanId") REFERENCES "lga_chairmen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lga_tenures" ADD CONSTRAINT "lga_tenures_lgaId_fkey" FOREIGN KEY ("lgaId") REFERENCES "lgas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

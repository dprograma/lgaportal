-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CITIZEN', 'LGA_CHAIRMAN', 'LGA_STAFF', 'ADVERTISER', 'ADMIN');

-- CreateEnum
CREATE TYPE "LGAStatus" AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED', 'DEACTIVATED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ResourceCategory" AS ENUM ('AGRICULTURE', 'MINERALS', 'LIVESTOCK', 'FISHERIES', 'FORESTRY', 'ENERGY', 'TOURISM', 'MANUFACTURING');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('PENDING', 'REVIEWED', 'CONNECTED', 'CLOSED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "phone" TEXT,
    "image" TEXT,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CITIZEN',
    "state" TEXT,
    "lga" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "banReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lgas" (
    "id" TEXT NOT NULL,
    "lgaName" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "chairmanName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "officeAddress" TEXT NOT NULL,
    "population" TEXT,
    "description" TEXT,
    "sectors" TEXT[],
    "logoUrl" TEXT,
    "status" "LGAStatus" NOT NULL DEFAULT 'PENDING',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "freeUntil" TIMESTAMP(3),
    "subscriptionEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lgas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lga_chairmen" (
    "id" TEXT NOT NULL,
    "lgaId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lga_chairmen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lga_accounts" (
    "id" TEXT NOT NULL,
    "chairmanId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,

    CONSTRAINT "lga_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lga_verification_tokens" (
    "id" TEXT NOT NULL,
    "chairmanId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lga_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lga_password_reset_tokens" (
    "id" TEXT NOT NULL,
    "chairmanId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lga_password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lga_verification_docs" (
    "id" TEXT NOT NULL,
    "lgaId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lga_verification_docs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investors" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "country" TEXT NOT NULL,
    "sectors" TEXT[],
    "minBudget" TEXT,
    "maxBudget" TEXT,
    "description" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lga_endowments" (
    "id" TEXT NOT NULL,
    "lgaId" TEXT NOT NULL,
    "category" "ResourceCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "highlights" TEXT[],
    "investmentRange" TEXT,
    "contactPerson" TEXT,
    "contactEmail" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lga_endowments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investor_inquiries" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "lgaId" TEXT NOT NULL,
    "endowmentId" TEXT,
    "message" TEXT NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investor_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "lgas_email_key" ON "lgas"("email");

-- CreateIndex
CREATE UNIQUE INDEX "lgas_lgaName_state_key" ON "lgas"("lgaName", "state");

-- CreateIndex
CREATE UNIQUE INDEX "lga_chairmen_lgaId_key" ON "lga_chairmen"("lgaId");

-- CreateIndex
CREATE UNIQUE INDEX "lga_chairmen_email_key" ON "lga_chairmen"("email");

-- CreateIndex
CREATE UNIQUE INDEX "lga_accounts_provider_providerAccountId_key" ON "lga_accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "lga_verification_tokens_token_key" ON "lga_verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "lga_password_reset_tokens_token_key" ON "lga_password_reset_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "investors_email_key" ON "investors"("email");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lga_chairmen" ADD CONSTRAINT "lga_chairmen_lgaId_fkey" FOREIGN KEY ("lgaId") REFERENCES "lgas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lga_accounts" ADD CONSTRAINT "lga_accounts_chairmanId_fkey" FOREIGN KEY ("chairmanId") REFERENCES "lga_chairmen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lga_verification_tokens" ADD CONSTRAINT "lga_verification_tokens_chairmanId_fkey" FOREIGN KEY ("chairmanId") REFERENCES "lga_chairmen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lga_password_reset_tokens" ADD CONSTRAINT "lga_password_reset_tokens_chairmanId_fkey" FOREIGN KEY ("chairmanId") REFERENCES "lga_chairmen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lga_verification_docs" ADD CONSTRAINT "lga_verification_docs_lgaId_fkey" FOREIGN KEY ("lgaId") REFERENCES "lgas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lga_endowments" ADD CONSTRAINT "lga_endowments_lgaId_fkey" FOREIGN KEY ("lgaId") REFERENCES "lgas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_inquiries" ADD CONSTRAINT "investor_inquiries_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "investors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_inquiries" ADD CONSTRAINT "investor_inquiries_lgaId_fkey" FOREIGN KEY ("lgaId") REFERENCES "lgas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_inquiries" ADD CONSTRAINT "investor_inquiries_endowmentId_fkey" FOREIGN KEY ("endowmentId") REFERENCES "lga_endowments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

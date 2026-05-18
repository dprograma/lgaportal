-- CreateTable
CREATE TABLE "wards" (
    "id" TEXT NOT NULL,
    "lgaId" TEXT NOT NULL,
    "wardName" TEXT NOT NULL,
    "wardNumber" INTEGER,
    "councillorName" TEXT NOT NULL,
    "councillorEmail" TEXT,
    "councillorPhone" TEXT,
    "councillorImage" TEXT,
    "description" TEXT,
    "population" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wards_lgaId_wardName_key" ON "wards"("lgaId", "wardName");

-- AddForeignKey
ALTER TABLE "wards" ADD CONSTRAINT "wards_lgaId_fkey" FOREIGN KEY ("lgaId") REFERENCES "lgas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

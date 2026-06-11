-- CreateEnum
CREATE TYPE "RemovalType" AS ENUM ('REFORESTATION', 'AFFORESTATION', 'SOIL_CARBON', 'BIOCHAR', 'DIRECT_AIR_CAPTURE', 'ENHANCED_WEATHERING', 'BLUE_CARBON', 'OTHER');

-- CreateEnum
CREATE TYPE "RemovalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "removal_projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "RemovalType" NOT NULL,
    "methodology" TEXT,
    "startYear" INTEGER NOT NULL,
    "endYear" INTEGER,
    "tCO2eRemovedPerYear" DOUBLE PRECISION NOT NULL,
    "verificationBody" TEXT,
    "status" "RemovalStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "removal_projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "removal_projects_companyId_startYear_idx" ON "removal_projects"("companyId", "startYear");

-- AddForeignKey
ALTER TABLE "removal_projects" ADD CONSTRAINT "removal_projects_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

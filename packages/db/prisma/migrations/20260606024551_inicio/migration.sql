-- CreateEnum
CREATE TYPE "LicenseType" AS ENUM ('BASIC', 'STANDARD', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MANAGER', 'VIEWER');

-- CreateEnum
CREATE TYPE "EmissionScope" AS ENUM ('SCOPE_1', 'SCOPE_2', 'SCOPE_3');

-- CreateEnum
CREATE TYPE "EmissionCategory" AS ENUM ('STATIONARY_COMBUSTION', 'MOBILE_COMBUSTION', 'PROCESS_EMISSIONS', 'FUGITIVE_EMISSIONS', 'PURCHASED_ELECTRICITY', 'PURCHASED_HEAT', 'PURCHASED_COOLING', 'BUSINESS_TRAVEL', 'EMPLOYEE_COMMUTING', 'WASTE_DISPOSAL', 'PURCHASED_GOODS', 'UPSTREAM_TRANSPORT', 'DOWNSTREAM_TRANSPORT', 'USE_OF_SOLD_PRODUCTS', 'END_OF_LIFE_TREATMENT');

-- CreateEnum
CREATE TYPE "MeasurementUnit" AS ENUM ('LITER', 'GALLON_US', 'M3', 'KG', 'TON', 'KWH', 'MWH', 'KM', 'KM_PASSENGER', 'TON_KM', 'TON_WASTE', 'USD');

-- CreateEnum
CREATE TYPE "FactorSource" AS ENUM ('IPCC_AR6', 'DEFRA_2023', 'EPA_2023', 'CUSTOM');

-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('DRAFT', 'COMPLETE', 'VERIFIED', 'PUBLISHED');

-- CreateTable
CREATE TABLE "super_admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "super_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'BO',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "reportingYear" INTEGER NOT NULL DEFAULT 2024,
    "licenseType" "LicenseType" NOT NULL DEFAULT 'BASIC',
    "licenseExpiresAt" TIMESTAMP(3),
    "maxUsers" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'BO',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emission_sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "assetCode" TEXT,
    "scope" "EmissionScope" NOT NULL,
    "category" "EmissionCategory" NOT NULL,
    "unit" "MeasurementUnit" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT,
    "emissionFactorId" TEXT,

    CONSTRAINT "emission_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumption_logs" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "emissionsKgCO2eq" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT,
    "emissionSourceId" TEXT NOT NULL,
    "recordedById" TEXT NOT NULL,

    CONSTRAINT "consumption_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_images" (
    "id" TEXT NOT NULL,
    "cloudinaryId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "description" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumptionLogId" TEXT NOT NULL,

    CONSTRAINT "evidence_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emission_factors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fuelType" TEXT,
    "unit" "MeasurementUnit" NOT NULL,
    "kgCO2" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "kgCH4" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "kgN2O" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "source" "FactorSource" NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'GLOBAL',
    "year" INTEGER NOT NULL DEFAULT 2023,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emission_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ghg_inventories" (
    "id" TEXT NOT NULL,
    "reportingYear" INTEGER NOT NULL,
    "status" "InventoryStatus" NOT NULL DEFAULT 'DRAFT',
    "totalScope1" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalScope2" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalScope3" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalEmissions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenueUSD" DOUBLE PRECISION,
    "employeeCount" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "ghg_inventories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "super_admins_email_key" ON "super_admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "companies_taxId_key" ON "companies"("taxId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "consumption_logs_companyId_year_month_idx" ON "consumption_logs"("companyId", "year", "month");

-- CreateIndex
CREATE INDEX "consumption_logs_emissionSourceId_year_idx" ON "consumption_logs"("emissionSourceId", "year");

-- CreateIndex
CREATE INDEX "evidence_images_consumptionLogId_idx" ON "evidence_images"("consumptionLogId");

-- CreateIndex
CREATE UNIQUE INDEX "ghg_inventories_companyId_reportingYear_key" ON "ghg_inventories"("companyId", "reportingYear");

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emission_sources" ADD CONSTRAINT "emission_sources_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emission_sources" ADD CONSTRAINT "emission_sources_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emission_sources" ADD CONSTRAINT "emission_sources_emissionFactorId_fkey" FOREIGN KEY ("emissionFactorId") REFERENCES "emission_factors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumption_logs" ADD CONSTRAINT "consumption_logs_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumption_logs" ADD CONSTRAINT "consumption_logs_emissionSourceId_fkey" FOREIGN KEY ("emissionSourceId") REFERENCES "emission_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumption_logs" ADD CONSTRAINT "consumption_logs_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_images" ADD CONSTRAINT "evidence_images_consumptionLogId_fkey" FOREIGN KEY ("consumptionLogId") REFERENCES "consumption_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ghg_inventories" ADD CONSTRAINT "ghg_inventories_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

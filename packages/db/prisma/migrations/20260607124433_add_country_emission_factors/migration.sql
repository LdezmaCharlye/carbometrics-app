-- CreateTable
CREATE TABLE "country_emission_factors" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "countryName" TEXT NOT NULL,
    "kgCO2perKwh" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "year" INTEGER NOT NULL DEFAULT 2023,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "country_emission_factors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "country_emission_factors_countryCode_key" ON "country_emission_factors"("countryCode");

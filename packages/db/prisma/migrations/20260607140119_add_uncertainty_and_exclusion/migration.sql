-- CreateEnum
CREATE TYPE "UncertaintyLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "emission_sources" ADD COLUMN     "exclusionReason" TEXT,
ADD COLUMN     "isExcluded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "uncertaintyLevel" "UncertaintyLevel" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "uncertaintyNote" TEXT;

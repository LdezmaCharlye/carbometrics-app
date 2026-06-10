-- CreateEnum
CREATE TYPE "DataQuality" AS ENUM ('DIGITAL_INVOICE', 'PHYSICAL_INVOICE', 'MEASURED', 'CALCULATED', 'ESTIMATED');

-- AlterTable
ALTER TABLE "consumption_logs" ADD COLUMN     "dataQuality" "DataQuality" NOT NULL DEFAULT 'ESTIMATED';

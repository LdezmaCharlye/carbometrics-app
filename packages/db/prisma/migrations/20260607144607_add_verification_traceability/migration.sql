-- AlterTable
ALTER TABLE "consumption_logs" ADD COLUMN     "verificationNote" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedById" TEXT;

-- AddForeignKey
ALTER TABLE "consumption_logs" ADD CONSTRAINT "consumption_logs_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

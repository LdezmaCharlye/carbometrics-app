import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("Admin2024!", 12);
  const sa = await prisma.superAdmin.create({
    data: {
      email:        "admin@carbometrics.app",
      name:         "Super Admin",
      passwordHash: hash,
    },
  });
  console.log("✅ SuperAdmin creado:", sa.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
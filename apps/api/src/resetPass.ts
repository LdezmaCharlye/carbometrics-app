import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("Manager2024!", 12);
  await prisma.user.update({
    where: { email: "manager@industriascbba.com" },
    data: { passwordHash: hash, mustChangePassword: false },
  });
  console.log("✅ Contraseña reseteada");
}

main().finally(() => prisma.$disconnect());
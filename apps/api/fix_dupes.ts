import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const factors = await prisma.emissionFactor.findMany({
    where: { isActive: true },
    select: { id: true, name: true, unit: true, kgCO2: true },
    orderBy: { name: "asc" },
  });
  console.log(JSON.stringify(factors, null, 2));
  await prisma.$disconnect();
}

main();
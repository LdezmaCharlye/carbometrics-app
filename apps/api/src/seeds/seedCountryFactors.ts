import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const COUNTRY_FACTORS = [
  { countryCode: "BO",     countryName: "Bolivia",        kgCO2perKwh: 0.5570, source: "CNDC 2023",      year: 2023 },
  { countryCode: "PE",     countryName: "Perú",           kgCO2perKwh: 0.3100, source: "MINEM 2023",     year: 2023 },
  { countryCode: "AR",     countryName: "Argentina",      kgCO2perKwh: 0.3900, source: "CAMMESA 2023",   year: 2023 },
  { countryCode: "CL",     countryName: "Chile",          kgCO2perKwh: 0.4020, source: "CNE 2023",       year: 2023 },
  { countryCode: "CO",     countryName: "Colombia",       kgCO2perKwh: 0.1760, source: "UPME 2023",      year: 2023 },
  { countryCode: "BR",     countryName: "Brasil",         kgCO2perKwh: 0.0760, source: "EPE 2023",       year: 2023 },
  { countryCode: "MX",     countryName: "México",         kgCO2perKwh: 0.4580, source: "SENER 2023",     year: 2023 },
  { countryCode: "EC",     countryName: "Ecuador",        kgCO2perKwh: 0.3850, source: "ARCONEL 2023",   year: 2023 },
  { countryCode: "PY",     countryName: "Paraguay",       kgCO2perKwh: 0.0250, source: "ANDE 2023",      year: 2023 },
  { countryCode: "UY",     countryName: "Uruguay",        kgCO2perKwh: 0.0870, source: "UTE 2023",       year: 2023 },
  { countryCode: "VE",     countryName: "Venezuela",      kgCO2perKwh: 0.2300, source: "CORPOELEC 2023", year: 2023 },
  { countryCode: "US",     countryName: "Estados Unidos", kgCO2perKwh: 0.3860, source: "EPA 2023",       year: 2023 },
  { countryCode: "ES",     countryName: "España",         kgCO2perKwh: 0.1800, source: "REE 2023",       year: 2023 },
  { countryCode: "GLOBAL", countryName: "Global",         kgCO2perKwh: 0.4930, source: "IEA 2023",       year: 2023 },
];

async function main() {
  console.log("🌱 Seeding country emission factors...");
  for (const f of COUNTRY_FACTORS) {
    await prisma.countryEmissionFactor.upsert({
      where:  { countryCode: f.countryCode },
      update: { kgCO2perKwh: f.kgCO2perKwh, source: f.source, year: f.year },
      create: f,
    });
    console.log(`✅ ${f.countryCode} — ${f.kgCO2perKwh} kgCO₂/kWh`);
  }
  console.log("✅ Listo!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
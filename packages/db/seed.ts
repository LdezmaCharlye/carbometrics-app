import { PrismaClient, FactorSource, MeasurementUnit } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Cargando factores de emisión...");

  const factors = [
    { id: "ef-diesel",     name: "Diésel (flota / generadores)", fuelType: "diesel",      unit: MeasurementUnit.LITER, kgCO2: 2.6391, kgCH4: 0.000077, kgN2O: 0.000143, source: FactorSource.IPCC_AR6, region: "GLOBAL" },
    { id: "ef-gasoline",   name: "Gasolina / Nafta",             fuelType: "gasoline",    unit: MeasurementUnit.LITER, kgCO2: 2.3113, kgCH4: 0.000149, kgN2O: 0.000142, source: FactorSource.IPCC_AR6, region: "GLOBAL" },
    { id: "ef-lpg-kg",     name: "GLP (Gas Licuado)",            fuelType: "lpg",         unit: MeasurementUnit.KG,    kgCO2: 2.9830, kgCH4: 0.000027, kgN2O: 0.000027, source: FactorSource.IPCC_AR6, region: "GLOBAL" },
    { id: "ef-natgas-m3",  name: "Gas Natural (m³)",             fuelType: "natural_gas", unit: MeasurementUnit.M3,    kgCO2: 2.0395, kgCH4: 0.000041, kgN2O: 0.000004, source: FactorSource.IPCC_AR6, region: "GLOBAL" },
    { id: "ef-elec-bo",    name: "Electricidad — Bolivia",       fuelType: "electricity", unit: MeasurementUnit.KWH,   kgCO2: 0.5600, kgCH4: 0.0,      kgN2O: 0.0,      source: FactorSource.IPCC_AR6, region: "BO"     },
    { id: "ef-elec-latam", name: "Electricidad — LATAM",         fuelType: "electricity", unit: MeasurementUnit.KWH,   kgCO2: 0.4200, kgCH4: 0.0,      kgN2O: 0.0,      source: FactorSource.IPCC_AR6, region: "LATAM"  },
    { id: "ef-air-short",  name: "Vuelo corto — económica",      fuelType: "aviation",    unit: MeasurementUnit.KM_PASSENGER, kgCO2: 0.2550, kgCH4: 0.0, kgN2O: 0.000007, source: FactorSource.DEFRA_2023, region: "GLOBAL" },
  ];

  for (const f of factors) {
    await prisma.emissionFactor.upsert({
      where:  { id: f.id },
      update: {},
      create: { ...f, year: 2023, isActive: true },
    });
  }

  console.log(`✅ ${factors.length} factores de emisión cargados`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
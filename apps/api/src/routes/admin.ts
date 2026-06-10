import { Hono } from "hono";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { requireSuperAdmin } from "../middleware/auth";

const router = new Hono();
const prisma = new PrismaClient();

router.use("*", requireSuperAdmin);

// GET /api/admin/dashboard
router.get("/dashboard", async (c) => {
  const [totalCompanies, activeCompanies, totalUsers, totalRecords] = await Promise.all([
    prisma.company.count(),
    prisma.company.count({ where: { isActive: true } }),
    prisma.user.count(),
    prisma.consumptionLog.count(),
  ]);
  const recentCompanies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { _count: { select: { users: true, branches: true } } },
  });
  return c.json({ totalCompanies, activeCompanies, totalUsers, totalRecords, recentCompanies });
});

// GET /api/admin/companies
router.get("/companies", async (c) => {
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true, branches: true, emissionSources: true } } },
  });
  return c.json(companies);
});

// POST /api/admin/companies
const companySchema = z.object({
  name:             z.string().min(2),
  taxId:            z.string().min(3),
  industry:         z.string(),
  country:          z.string().default("BO"),
  orgBoundaryType:  z.enum(["OPERATIONAL_CONTROL", "FINANCIAL_CONTROL", "EQUITY_SHARE"]).default("OPERATIONAL_CONTROL"),
  baseYear:         z.number().int().optional(),
  licenseType:      z.enum(["BASIC", "STANDARD", "ENTERPRISE"]).default("BASIC"),
  licenseExpiresAt: z.string().optional(),
  yearFrom:         z.number().int().min(2000).default(2020),
  yearTo:           z.number().int().min(2000).default(2025),
  reportingYear:    z.number().int().default(new Date().getFullYear()),
});

router.post("/companies", async (c) => {
  const body   = await c.req.json().catch(() => null);
  const parsed = companySchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Datos inválidos", detail: parsed.error.flatten() }, 400);

  const { licenseType, yearFrom, yearTo } = parsed.data;
  const yearRange = yearTo - yearFrom + 1;

  if (licenseType === "BASIC"    && yearRange > 5)  return c.json({ error: "Plan Básico permite máximo 5 años de inventario" }, 422);
  if (licenseType === "STANDARD" && yearRange > 10) return c.json({ error: "Plan Estándar permite máximo 10 años de inventario" }, 422);

  const maxUsers = licenseType === "BASIC" ? 2 : licenseType === "STANDARD" ? 5 : 999;

  const data: any = { ...parsed.data, maxUsers };
  if (parsed.data.licenseExpiresAt) {
    data.licenseExpiresAt = new Date(parsed.data.licenseExpiresAt);
  } else {
    delete data.licenseExpiresAt;
  }

  const company = await prisma.company.create({ data });

  // Buscar FE de electricidad del país (fallback a GLOBAL)
  const countryFE = await prisma.countryEmissionFactor.findFirst({
    where: { countryCode: parsed.data.country, isActive: true },
  }) ?? await prisma.countryEmissionFactor.findFirst({
    where: { countryCode: "GLOBAL", isActive: true },
  });

  const kgCO2perKwh = countryFE?.kgCO2perKwh ?? 0.493;

  // Crear EmissionFactor de electricidad específico para esta empresa
  const electricityFactor = await prisma.emissionFactor.create({
    data: {
      name:     `Electricidad red — ${parsed.data.country}`,
      fuelType: "ELECTRICITY_GRID",
      unit:     "KWH",
      kgCO2:    kgCO2perKwh,
      kgCH4:    0,
      kgN2O:    0,
      source:   "CUSTOM",
      region:   parsed.data.country,
      year:     countryFE?.year ?? 2023,
    },
  });

  // Fuentes de emisión predefinidas
  await prisma.emissionSource.createMany({
    data: [
      {
        name:             "Electricidad red eléctrica",
        description:      `Factor: ${kgCO2perKwh} kgCO₂/kWh — ${countryFE?.source ?? "IEA 2023"}`,
        scope:            "SCOPE_2",
        category:         "PURCHASED_ELECTRICITY",
        unit:             "KWH",
        companyId:        company.id,
        emissionFactorId: electricityFactor.id,
      },
      {
        name:        "Diésel — combustión estacionaria",
        description: "Factor: 2.68 kgCO₂/L — IPCC AR6",
        scope:       "SCOPE_1",
        category:    "STATIONARY_COMBUSTION",
        unit:        "LITER",
        companyId:   company.id,
      },
      {
        name:        "Gasolina — vehículos",
        description: "Factor: 2.31 kgCO₂/L — IPCC AR6",
        scope:       "SCOPE_1",
        category:    "MOBILE_COMBUSTION",
        unit:        "LITER",
        companyId:   company.id,
      },
      {
        name:        "GLP / Gas licuado",
        description: "Factor: 2.98 kgCO₂/kg — IPCC AR6",
        scope:       "SCOPE_1",
        category:    "STATIONARY_COMBUSTION",
        unit:        "KG",
        companyId:   company.id,
      },
      {
        name:        "Viajes aéreos",
        description: "Factor: 0.255 kgCO₂/km-pax — IPCC AR6",
        scope:       "SCOPE_3",
        category:    "BUSINESS_TRAVEL",
        unit:        "KM_PASSENGER",
        companyId:   company.id,
      },
      {
        name:        "Gases refrigerantes (HFCs)",
        description: "Factor: 1430 kgCO₂eq/kg — R-134a — IPCC AR6",
        scope:       "SCOPE_1",
        category:    "FUGITIVE_EMISSIONS",
        unit:        "KG",
        companyId:   company.id,
      },
      {
        name:        "Gases fluorados (PFCs)",
        description: "Factor: 7390 kgCO₂eq/kg — CF4 — IPCC AR6",
        scope:       "SCOPE_1",
        category:    "FUGITIVE_EMISSIONS",
        unit:        "KG",
        companyId:   company.id,
      },
      {
        name:        "Hexafluoruro de azufre (SF6)",
        description: "Factor: 23500 kgCO2eq/kg — IPCC AR6",
        scope:       "SCOPE_1",
        category:    "FUGITIVE_EMISSIONS",
        unit:        "KG",
        companyId:   company.id,
      },
    ],
  });

  return c.json({ ...company, sourcesCreated: 8 }, 201);
});

// PATCH /api/admin/companies/:id
router.patch("/companies/:id", async (c) => {
  const body   = await c.req.json().catch(() => null);
  const schema = z.object({
    name:             z.string().min(2).optional(),
    industry:         z.string().optional(),
    country:          z.string().optional(),
    orgBoundaryType:    z.enum(["OPERATIONAL_CONTROL", "FINANCIAL_CONTROL", "EQUITY_SHARE"]).optional(),
    baseYear:           z.number().int().optional(),
    baseYearRecalcNote: z.string().optional(),
    isActive:           z.boolean().optional(),
    licenseType:      z.enum(["BASIC", "STANDARD", "ENTERPRISE"]).optional(),
    licenseExpiresAt: z.string().nullable().optional(),
    yearFrom:         z.number().int().optional(),
    yearTo:           z.number().int().optional(),
    reportingYear:    z.number().int().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Datos inválidos" }, 400);

  const current = await prisma.company.findUnique({ where: { id: c.req.param("id") } });
  if (!current) return c.json({ error: "Empresa no encontrada" }, 404);

  // Validar cambio de año base
  if (parsed.data.baseYear && current.baseYear && parsed.data.baseYear !== current.baseYear) {
    const hasInventory = await prisma.ghgInventory.findUnique({
      where: { companyId_reportingYear: { companyId: c.req.param("id"), reportingYear: current.baseYear } },
    });
    if (hasInventory && !parsed.data.baseYearRecalcNote) {
      return c.json({
        error: "RECALC_REQUIRED",
        message: "El año base tiene datos registrados. Debe proporcionar una justificación para el recálculo.",
      }, 422);
    }
  }

  const licenseType = parsed.data.licenseType ?? current.licenseType;
  const yearFrom    = parsed.data.yearFrom    ?? current.yearFrom;
  const yearTo      = parsed.data.yearTo      ?? current.yearTo;
  const yearRange   = yearTo - yearFrom + 1;

  if (licenseType === "BASIC"    && yearRange > 5)  return c.json({ error: "Plan Básico permite máximo 5 años de inventario" }, 422);
  if (licenseType === "STANDARD" && yearRange > 10) return c.json({ error: "Plan Estándar permite máximo 10 años de inventario" }, 422);

  const maxUsers = licenseType === "BASIC" ? 2 : licenseType === "STANDARD" ? 5 : 999;

  const data: any = { ...parsed.data, maxUsers };
  if (parsed.data.licenseExpiresAt === null) {
    data.licenseExpiresAt = null;
  } else if (parsed.data.licenseExpiresAt) {
    data.licenseExpiresAt = new Date(parsed.data.licenseExpiresAt);
  } else {
    delete data.licenseExpiresAt;
  }

  const company = await prisma.company.update({ where: { id: c.req.param("id") }, data });
  return c.json(company);
});

// POST /api/admin/users
const userSchema = z.object({
  email:     z.string().email(),
  name:      z.string().min(2),
  password:  z.string().min(8),
  role:      z.enum(["MANAGER", "VIEWER"]).default("MANAGER"),
  companyId: z.string(),
  branchId:  z.string().optional(),
});

router.post("/users", async (c) => {
  const body   = await c.req.json().catch(() => null);
  const parsed = userSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Datos inválidos", detail: parsed.error.flatten() }, 400);

  const company = await prisma.company.findUnique({
    where:   { id: parsed.data.companyId },
    include: { _count: { select: { users: true } } },
  });
  if (!company) return c.json({ error: "Empresa no encontrada" }, 404);
  if (company._count.users >= company.maxUsers) {
    return c.json({ error: `Límite de ${company.maxUsers} usuarios alcanzado para el plan ${company.licenseType}.` }, 422);
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email, name: parsed.data.name, passwordHash,
      role: parsed.data.role, companyId: parsed.data.companyId,
      branchId: parsed.data.branchId, mustChangePassword: true,
    },
    select: { id: true, email: true, name: true, role: true, companyId: true, mustChangePassword: true },
  });
  return c.json({ ...user, temporaryPassword: parsed.data.password }, 201);
});

// GET /api/admin/users
router.get("/users", async (c) => {
  const companyId = c.req.query("companyId");
  const users = await prisma.user.findMany({
    where:   companyId ? { companyId } : {},
    orderBy: { createdAt: "desc" },
    select: {
      id: true, email: true, name: true, role: true, isActive: true,
      lastLoginAt: true, mustChangePassword: true,
      company: { select: { name: true } },
      branch:  { select: { name: true } },
    },
  });
  return c.json(users);
});

// PATCH /api/admin/users/:id
router.patch("/users/:id", async (c) => {
  const body   = await c.req.json().catch(() => null);
  const schema = z.object({
    isActive: z.boolean().optional(),
    role:     z.enum(["MANAGER", "VIEWER"]).optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Datos inválidos" }, 400);
  const user = await prisma.user.update({
    where: { id: c.req.param("id") },
    data:  parsed.data,
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });
  return c.json(user);
});

// GET /api/admin/emission-factors
router.get("/emission-factors", async (c) => {
  const factors = await prisma.emissionFactor.findMany({
    orderBy: { createdAt: "desc" },
  });
  return c.json(factors);
});

// POST /api/admin/emission-factors
router.post("/emission-factors", async (c) => {
  const body = await c.req.json().catch(() => null);
  const schema = z.object({
    name:     z.string().min(2),
    fuelType: z.string().optional(),
    unit:     z.enum(["LITER","GALLON_US","M3","KG","TON","KWH","MWH","KM","KM_PASSENGER","TON_KM","TON_WASTE","USD"]),
    kgCO2:   z.number().min(0),
    kgCH4:   z.number().min(0),
    kgN2O:   z.number().min(0),
    source:  z.enum(["IPCC_AR6","DEFRA_2023","EPA_2023","CUSTOM"]),
    region:  z.string().default("GLOBAL"),
    year:    z.number().int().default(new Date().getFullYear()),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Datos inválidos", detail: parsed.error.flatten() }, 400);
  const factor = await prisma.emissionFactor.create({ data: parsed.data });
  return c.json(factor, 201);
});

// PATCH /api/admin/emission-factors/:id
router.patch("/emission-factors/:id", async (c) => {
  const body = await c.req.json().catch(() => null);
  const schema = z.object({
    name:     z.string().min(2).optional(),
    fuelType: z.string().optional(),
    kgCO2:   z.number().min(0).optional(),
    kgCH4:   z.number().min(0).optional(),
    kgN2O:   z.number().min(0).optional(),
    source:  z.enum(["IPCC_AR6","DEFRA_2023","EPA_2023","CUSTOM"]).optional(),
    region:  z.string().optional(),
    year:    z.number().int().optional(),
    isActive: z.boolean().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Datos inválidos" }, 400);
  const factor = await prisma.emissionFactor.update({
    where: { id: c.req.param("id") },
    data:  parsed.data,
  });
  return c.json(factor);
});

// GET /api/admin/consumption
router.get("/consumption", async (c) => {
  const companyId = c.req.query("companyId");
  const year      = c.req.query("year") ? parseInt(c.req.query("year")!) : undefined;
  const logs = await prisma.consumptionLog.findMany({
    where: {
      ...(companyId ? { companyId } : {}),
      ...(year      ? { year }      : {}),
    },
    orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
    take: 200,
    include: {
      emissionSource: { select: { name: true, scope: true, unit: true } },
      recordedBy:     { select: { name: true, email: true } },
    },
  });
  return c.json(logs);
});
// GET /api/admin/country-factors
router.get("/country-factors", async (c) => {
  const factors = await prisma.countryEmissionFactor.findMany({
    orderBy: { countryName: "asc" },
  });
  return c.json(factors);
});

// PATCH /api/admin/country-factors/:id
router.patch("/country-factors/:id", async (c) => {
  const body = await c.req.json().catch(() => null);
  const schema = z.object({
    kgCO2perKwh: z.number().min(0).optional(),
    source:      z.string().optional(),
    year:        z.number().int().optional(),
    isActive:    z.boolean().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Datos inválidos" }, 400);
  const factor = await prisma.countryEmissionFactor.update({
    where: { id: c.req.param("id") },
    data:  parsed.data,
  });
  return c.json(factor);
});
// GET /api/admin/companies/:id/sources
router.get("/companies/:id/sources", async (c) => {
  const sources = await prisma.emissionSource.findMany({
    where:   { companyId: c.req.param("id") },
    include: { emissionFactor: { select: { name: true, kgCO2: true, unit: true } } },
    orderBy: [{ scope: "asc" }, { name: "asc" }],
  });
  return c.json(sources);
});

// PATCH /api/admin/companies/:companyId/sources/:sourceId
router.patch("/companies/:companyId/sources/:sourceId", async (c) => {
  const body = await c.req.json().catch(() => null);
  const schema = z.object({
    uncertaintyLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    uncertaintyNote:  z.string().optional(),
    isExcluded:       z.boolean().optional(),
    exclusionReason:  z.string().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Datos inválidos" }, 400);

  if (parsed.data.isExcluded && !parsed.data.exclusionReason) {
    return c.json({ error: "Debe proporcionar una razón para excluir la fuente" }, 422);
  }

  const source = await prisma.emissionSource.update({
    where: { id: c.req.param("sourceId") },
    data:  parsed.data,
  });
  return c.json(source);
});
// GET /api/admin/my-license — estado de licencia para usuarios normales
router.get("/my-license", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return c.json({ error: "No autorizado" }, 401);
  
  try {
    const jwt = await import("jsonwebtoken");
    const payload = jwt.default.verify(
      authHeader.slice(7),
      process.env.JWT_SECRET ?? "dev-secret"
    ) as any;
    
    if (!payload.companyId) return c.json({ licenseExpiresAt: null });
    
    const company = await prisma.company.findUnique({
      where:  { id: payload.companyId },
      select: { licenseExpiresAt: true, isActive: true, name: true },
    });
    return c.json(company ?? { licenseExpiresAt: null });
  } catch {
    return c.json({ error: "Token inválido" }, 401);
  }
});

export { router as adminRouter };
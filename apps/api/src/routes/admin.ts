import { Hono } from "hono";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { requireSuperAdmin } from "../middleware/auth";

const router = new Hono();

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
  extraUsers:           z.number().int().min(0).default(0),
  extraYears:           z.number().int().min(0).default(0),
  extraEmissionSources: z.number().int().min(0).default(0),
});

router.post("/companies", async (c) => {
  const body   = await c.req.json().catch(() => null);
  const parsed = companySchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Datos inválidos", detail: parsed.error.flatten() }, 400);

  const { licenseType, yearFrom, yearTo, extraUsers, extraYears, extraEmissionSources } = parsed.data;
  const yearRange = yearTo - yearFrom + 1;

  const baseMaxYears = licenseType === "BASIC" ? 2 : licenseType === "STANDARD" ? 3 : 5;
  const maxRange = baseMaxYears + extraYears;
  if (yearRange > maxRange) return c.json({ error: `Este plan permite máximo ${maxRange} año(s) de inventario (incluyendo adicionales)` }, 422);

  const baseMaxUsers = licenseType === "BASIC" ? 1 : licenseType === "STANDARD" ? 5 : 10;
  const maxUsers = baseMaxUsers + extraUsers;
  const maxBranches = licenseType === "BASIC" ? 1 : licenseType === "STANDARD" ? 5 : 10;
  const baseMaxSources = licenseType === "BASIC" ? 2 : licenseType === "STANDARD" ? 5 : 7;
  const maxEmissionSources = baseMaxSources + extraEmissionSources;

  const data: any = { ...parsed.data, maxUsers, maxBranches, maxEmissionSources };
  if (parsed.data.licenseExpiresAt) {
    data.licenseExpiresAt = new Date(parsed.data.licenseExpiresAt);
  } else {
    delete data.licenseExpiresAt;
  }

  const company = await prisma.company.create({ data });
  return c.json(company, 201);
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
    extraUsers:           z.number().int().min(0).optional(),
    extraYears:           z.number().int().min(0).optional(),
    extraEmissionSources: z.number().int().min(0).optional(),
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
  const extraUsers           = parsed.data.extraUsers           ?? current.extraUsers;
  const extraYears           = parsed.data.extraYears           ?? current.extraYears;
  const extraEmissionSources = parsed.data.extraEmissionSources ?? current.extraEmissionSources;

  const baseMaxYears = licenseType === "BASIC" ? 2 : licenseType === "STANDARD" ? 3 : 5;
  const maxRange = baseMaxYears + extraYears;
  if (yearRange > maxRange) return c.json({ error: `Este plan permite máximo ${maxRange} año(s) de inventario (incluyendo adicionales)` }, 422);

  const baseMaxUsers = licenseType === "BASIC" ? 1 : licenseType === "STANDARD" ? 5 : 10;
  const maxUsers = baseMaxUsers + extraUsers;
  const maxBranches = licenseType === "BASIC" ? 1 : licenseType === "STANDARD" ? 5 : 10;
  const baseMaxSources = licenseType === "BASIC" ? 2 : licenseType === "STANDARD" ? 5 : 7;
  const maxEmissionSources = baseMaxSources + extraEmissionSources;

  const data: any = { ...parsed.data, maxUsers, maxBranches, maxEmissionSources };
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

// DELETE /api/admin/companies/:id
router.delete("/companies/:id", async (c) => {
  const id = c.req.param("id");
  try {
    await prisma.company.delete({ where: { id } });
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "No se pudo eliminar la empresa. Es posible que tenga datos relacionados que lo impiden." }, 500);
  }
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

// POST /api/admin/companies/:id/sources
router.post("/companies/:id/sources", async (c) => {
  const companyId = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const schema = z.object({
    name:             z.string().min(2),
    description:      z.string().optional(),
    scope:            z.enum(["SCOPE_1", "SCOPE_2", "SCOPE_3"]),
    category:         z.enum(["STATIONARY_COMBUSTION","MOBILE_COMBUSTION","PROCESS_EMISSIONS","FUGITIVE_EMISSIONS","PURCHASED_ELECTRICITY","PURCHASED_HEAT","PURCHASED_COOLING","BUSINESS_TRAVEL","EMPLOYEE_COMMUTING","WASTE_DISPOSAL","PURCHASED_GOODS","UPSTREAM_TRANSPORT","DOWNSTREAM_TRANSPORT","USE_OF_SOLD_PRODUCTS","END_OF_LIFE_TREATMENT"]),
    unit:             z.enum(["LITER","GALLON_US","M3","KG","TON","KWH","MWH","KM","KM_PASSENGER","TON_KM","TON_WASTE","USD"]),
    emissionFactorId: z.string().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Datos inválidos", detail: parsed.error.flatten() }, 400);
  const source = await prisma.emissionSource.create({
    data: { ...parsed.data, companyId },
  });
  return c.json(source, 201);
});

// PATCH /api/admin/companies/:companyId/sources/:sourceId
router.patch("/companies/:companyId/sources/:sourceId", async (c) => {
  const body = await c.req.json().catch(() => null);
  const schema = z.object({
    uncertaintyLevel:  z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    uncertaintyNote:   z.string().optional(),
    isExcluded:        z.boolean().optional(),
    exclusionReason:   z.string().optional(),
    isActive:          z.boolean().optional(),
    emissionFactorId:  z.string().optional(),
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
// DELETE /api/admin/companies/:companyId/sources/:sourceId
router.delete("/companies/:companyId/sources/:sourceId", async (c) => {
  const { sourceId } = c.req.param();
  try {
    const hasLogs = await prisma.consumptionLog.count({
      where: { emissionSourceId: sourceId },
    });
    if (hasLogs > 0) {
      return c.json({ error: "No se puede eliminar una fuente con registros de consumo. Desactívala en su lugar." }, 422);
    }
    await prisma.emissionSource.delete({ where: { id: sourceId } });
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Error al eliminar la fuente" }, 500);
  }
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

// GET /api/admin/companies/:id/branches
router.get("/companies/:id/branches", async (c) => {
  const branches = await prisma.branch.findMany({
    where:   { companyId: c.req.param("id") },
    orderBy: { createdAt: "asc" },
  });
  return c.json(branches);
});

// POST /api/admin/companies/:id/branches — sin límite, el admin puede exceder el plan
router.post("/companies/:id/branches", async (c) => {
  const companyId = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const schema = z.object({
    name:    z.string().min(2),
    address: z.string().optional(),
    city:    z.string().optional(),
    country: z.string().default("BO"),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Datos inválidos", detail: parsed.error.flatten() }, 400);

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) return c.json({ error: "Empresa no encontrada" }, 404);

  const branchData: any = { ...parsed.data, companyId };
  const branch = await prisma.branch.create({ data: branchData });
  return c.json(branch, 201);
});

// GET /api/admin/terms-logs
router.get("/terms-logs", async (c) => {
  const companyId = c.req.query("companyId");
  const logs = await prisma.termsAcceptanceLog.findMany({
    where:   companyId ? { companyId } : {},
    orderBy: { acceptedAt: "desc" },
  });
  return c.json(logs);
});

// PATCH /api/admin/users/:id/reset-password
router.patch("/users/:id/reset-password", async (c) => {
  const body = await c.req.json().catch(() => null);
  const schema = z.object({
    password: z.string().min(6),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: "La contraseña debe tener al menos 6 caracteres" }, 400);

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.update({
    where: { id: c.req.param("id") },
    data:  { passwordHash, mustChangePassword: true },
    select: { id: true, email: true, name: true },
  });
  return c.json({ ...user, temporaryPassword: parsed.data.password });
});

export { router as adminRouter };
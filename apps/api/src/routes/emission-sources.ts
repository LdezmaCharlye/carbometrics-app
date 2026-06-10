import { Hono } from "hono";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { requireAuth, requireManager } from "../middleware/auth";

const router = new Hono();
const prisma = new PrismaClient();

// GET /api/sources — lista fuentes de la empresa
router.get("/", requireAuth, async (c) => {
  const payload = c.get("jwtPayload") as any;
  const sources = await prisma.emissionSource.findMany({
    where:   { companyId: payload.companyId, isActive: true },
    include: { emissionFactor: { select: { id: true, name: true, kgCO2: true, kgCH4: true, kgN2O: true, unit: true } } },
    orderBy: [{ scope: "asc" }, { name: "asc" }],
  });
  return c.json(sources);
});

// POST /api/sources — crear fuente de emisión
const sourceSchema = z.object({
  name:            z.string().min(2),
  description:     z.string().optional(),
  assetCode:       z.string().optional(),
  scope:           z.enum(["SCOPE_1", "SCOPE_2", "SCOPE_3"]),
  category:        z.enum([
    "STATIONARY_COMBUSTION","MOBILE_COMBUSTION","PROCESS_EMISSIONS","FUGITIVE_EMISSIONS",
    "PURCHASED_ELECTRICITY","PURCHASED_HEAT","PURCHASED_COOLING",
    "BUSINESS_TRAVEL","EMPLOYEE_COMMUTING","WASTE_DISPOSAL","PURCHASED_GOODS",
    "UPSTREAM_TRANSPORT","DOWNSTREAM_TRANSPORT","USE_OF_SOLD_PRODUCTS","END_OF_LIFE_TREATMENT"
  ]),
  unit:            z.enum(["LITER","GALLON_US","M3","KG","TON","KWH","MWH","KM","KM_PASSENGER","TON_KM","TON_WASTE","USD"]),
  emissionFactorId:  z.string().optional(),
  branchId:          z.string().optional(),
  uncertaintyLevel:  z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  uncertaintyNote:   z.string().optional(),
  isExcluded:        z.boolean().default(false),
  exclusionReason:   z.string().optional(),
});

router.post("/", requireManager, async (c) => {
  const payload = c.get("jwtPayload") as any;
  const body    = await c.req.json().catch(() => null);
  const parsed  = sourceSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Datos inválidos", detail: parsed.error.flatten() }, 400);

  const source = await prisma.emissionSource.create({
    data: { ...parsed.data, companyId: payload.companyId },
  });
  return c.json(source, 201);
});

// GET /api/sources/factors — lista factores de emisión disponibles
router.get("/factors", requireAuth, async (c) => {
  const factors = await prisma.emissionFactor.findMany({
    where:   { isActive: true },
    orderBy: { name: "asc" },
  });
  return c.json(factors);
});
// PATCH /api/sources/:id
router.patch("/:id", requireManager, async (c) => {
  const payload = c.get("jwtPayload") as any;
  const body    = await c.req.json().catch(() => null);
  const schema  = z.object({
    name:             z.string().min(2).optional(),
    description:      z.string().optional(),
    uncertaintyLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    uncertaintyNote:  z.string().optional(),
    isExcluded:       z.boolean().optional(),
    exclusionReason:  z.string().optional(),
    isActive:         z.boolean().optional(),
    emissionFactorId: z.string().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Datos inválidos" }, 400);

  // Verificar que la fuente pertenece a la empresa
  const source = await prisma.emissionSource.findFirst({
    where: { id: c.req.param("id"), companyId: payload.companyId },
  });
  if (!source) return c.json({ error: "Fuente no encontrada" }, 404);

  // Si se excluye, debe tener razón
  if (parsed.data.isExcluded && !parsed.data.exclusionReason && !source.exclusionReason) {
    return c.json({ error: "Debe proporcionar una razón para excluir la fuente" }, 422);
  }

  const updated = await prisma.emissionSource.update({
    where: { id: c.req.param("id") },
    data:  parsed.data,
  });
  return c.json(updated);
});

export { router as sourcesRouter };
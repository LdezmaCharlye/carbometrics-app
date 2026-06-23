import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireManager } from "../middleware/auth";

const router = new Hono();

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

// GET /api/sources/factors — fuentes ACTIVAS de la empresa con su factor de emisión
router.get("/factors", requireAuth, async (c) => {
  const payload = c.get("jwtPayload") as any;
  const sources = await prisma.emissionSource.findMany({
    where: {
      companyId: payload.companyId,
      isActive: true,
      isExcluded: false,
    },
    include: {
      emissionFactor: {
        select: { id: true, name: true, kgCO2: true, kgCH4: true, kgN2O: true, unit: true },
      },
    },
    orderBy: [{ scope: "asc" }, { name: "asc" }],
  });
  return c.json(sources.map((s) => ({
    id: s.id,
    name: s.name,
    scope: s.scope,
    unit: s.unit,
    kgCO2: s.emissionFactor?.kgCO2 ?? 0,
    kgCH4: s.emissionFactor?.kgCH4 ?? 0,
    kgN2O: s.emissionFactor?.kgN2O ?? 0,
  })));
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
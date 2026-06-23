import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireManager } from "../middleware/auth";

const router = new Hono();

// GET /api/branches — listar sucursales de mi empresa
router.get("/", requireAuth, async (c) => {
  const payload = c.get("jwtPayload") as any;
  const branches = await prisma.branch.findMany({
    where:   { companyId: payload.companyId },
    orderBy: { createdAt: "asc" },
  });
  return c.json(branches);
});

// POST /api/branches — crear sucursal (límite del plan aplica)
const branchSchema = z.object({
  name:    z.string().min(2),
  address: z.string().optional(),
  city:    z.string().optional(),
  country: z.string().default("BO"),
});

router.post("/", requireManager, async (c) => {
  const payload = c.get("jwtPayload") as any;
  const body    = await c.req.json().catch(() => null);
  const parsed  = branchSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Datos inválidos", detail: parsed.error.flatten() }, 400);

  const company = await prisma.company.findUnique({
    where:   { id: payload.companyId },
    include: { _count: { select: { branches: true } } },
  });
  if (!company) return c.json({ error: "Empresa no encontrada" }, 404);

  if (company._count.branches >= company.maxBranches) {
    return c.json({ error: `Límite de ${company.maxBranches} instalación(es) alcanzado para el plan ${company.licenseType}. Contacta al administrador para ampliarlo.` }, 422);
  }

  const branchData: any = { ...parsed.data, companyId: payload.companyId };
  const branch = await prisma.branch.create({ data: branchData });
  return c.json(branch, 201);
});

// PATCH /api/branches/:id — editar/desactivar sucursal
router.patch("/:id", requireManager, async (c) => {
  const payload = c.get("jwtPayload") as any;
  const { id }  = c.req.param();
  const body    = await c.req.json().catch(() => null);
  const schema  = z.object({
    name:     z.string().min(2).optional(),
    address:  z.string().optional(),
    city:     z.string().optional(),
    isActive: z.boolean().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Datos inválidos" }, 400);

  const existing = await prisma.branch.findFirst({ where: { id, companyId: payload.companyId } });
  if (!existing) return c.json({ error: "Sucursal no encontrada" }, 404);

  const branch = await prisma.branch.update({ where: { id }, data: parsed.data });
  return c.json(branch);
});

export { router as branchesRouter };
import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireSuperAdmin } from "../middleware/auth";

const router = new Hono();

const PLAN_PRICES: Record<string, number> = {
  BASIC: 50, STANDARD: 100, ENTERPRISE: 150,
};

router.get("/", requireSuperAdmin, async (c) => {
  const companyId = c.req.query("companyId");
  const status    = c.req.query("status");
  const sales = await prisma.sale.findMany({
    where: {
      ...(companyId ? { companyId } : {}),
      ...(status    ? { status: status as any } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  return c.json(sales);
});

router.get("/:id", async (c) => {
  const sale = await prisma.sale.findUnique({ where: { id: c.req.param("id") } });
  if (!sale) return c.json({ error: "Recibo no encontrado" }, 404);
  return c.json(sale);
});

router.post("/", requireSuperAdmin, async (c) => {
  const body   = await c.req.json().catch(() => null);
  const schema = z.object({
    companyId:    z.string(),
    plan:         z.enum(["BASIC", "STANDARD", "ENTERPRISE"]),
    periodMonth:  z.number().int().min(1).max(12),
    periodYear:   z.number().int(),
    extraUsers:   z.number().int().min(0).default(0),
    extraYears:   z.number().int().min(0).default(0),
    extraSources: z.number().int().min(0).default(0),
    method:       z.enum(["TRANSFER","QR_BOLIVIA","STRIPE","CASH"]).default("TRANSFER"),
    notes:        z.string().optional(),
    dueDate:      z.string().optional(),
    clientEmail:  z.string().email().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Datos inválidos", detail: parsed.error.flatten() }, 400);

  const company = await prisma.company.findUnique({
    where:  { id: parsed.data.companyId },
    select: { name: true, taxId: true },
  });
  if (!company) return c.json({ error: "Empresa no encontrada" }, 404);

  const base   = PLAN_PRICES[parsed.data.plan] ?? 50;
  const extras = (parsed.data.extraUsers * 15) + (parsed.data.extraYears * 20) + (parsed.data.extraSources * 15);
  const sub    = base + extras;
  const iva    = Math.round(sub * 0.13 * 100) / 100;
  const total  = Math.round((sub + iva) * 100) / 100;

  const count  = await prisma.sale.count();
  const number = `REC-${parsed.data.periodYear}-${String(count + 1).padStart(4, "0")}`;

  const sale = await prisma.sale.create({
    data: {
      number,
      companyId:       parsed.data.companyId,
      companyName:     company.name,
      companyTaxId:    company.taxId,
      plan:            parsed.data.plan,
      periodMonth:     parsed.data.periodMonth,
      periodYear:      parsed.data.periodYear,
      extraUsers:      parsed.data.extraUsers,
      extraYears:      parsed.data.extraYears,
      extraSources:    parsed.data.extraSources,
      baseAmountUSD:   base,
      extrasAmountUSD: extras,
      subtotalUSD:     sub,
      ivaPercent:      13,
      ivaUSD:          iva,
      totalUSD:        total,
      method:          parsed.data.method,
      notes:           parsed.data.notes,
      clientEmail:     parsed.data.clientEmail,
      dueDate:         parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
    },
  });
  return c.json(sale, 201);
});

router.patch("/:id", requireSuperAdmin, async (c) => {
  const body   = await c.req.json().catch(() => null);
  const schema = z.object({
    status:      z.enum(["PENDING","PAID","OVERDUE","CANCELLED"]).optional(),
    notes:       z.string().optional(),
    clientEmail: z.string().email().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Datos inválidos" }, 400);

  const data: any = { ...parsed.data };
  if (parsed.data.status === "PAID") data.paidAt = new Date();

  const sale = await prisma.sale.update({
    where: { id: c.req.param("id") },
    data,
  });
  return c.json(sale);
});

export { router as salesRouter };
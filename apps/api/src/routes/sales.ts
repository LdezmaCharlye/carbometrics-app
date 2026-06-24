import { Hono } from "hono";
import { z } from "zod";
import { Resend } from "resend";
import { prisma } from "../lib/prisma";
import { requireSuperAdmin } from "../middleware/auth";

const router = new Hono();
const resend = new Resend(process.env.RESEND_API_KEY);

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

  if (parsed.data.status === "PAID" && sale.clientEmail) {
    const PLAN_LABELS: Record<string,string> = {
      BASIC: "Plan Básico", STANDARD: "Plan Standard", ENTERPRISE: "Plan Corporativo",
    };
    const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    const receiptUrl = `https://carbometrics.site/receipts/${sale.id}`;
    const planLabel  = PLAN_LABELS[sale.plan] ?? sale.plan;
    const periodo    = `${MONTHS[sale.periodMonth - 1]} ${sale.periodYear}`;

    try {
      await resend.emails.send({
        from:    "CarboMetrics <noreply@carbometrics.site>",
        to:      [sale.clientEmail],
        subject: `✅ Pago confirmado — ${sale.number} · CarboMetrics`,
        html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;max-width:600px">
        <tr>
          <td style="background:#16a34a;padding:24px 32px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="vertical-align:middle">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="background:#15803d;width:46px;height:46px;border-radius:10px;border:2px solid rgba(255,255,255,0.35);text-align:center;vertical-align:middle;font-size:24px;line-height:46px">
                        🌿
                      </td>
                    </tr>
                  </table>
                </td>
                      <td style="padding-left:12px;vertical-align:middle">
                        <div style="color:white;font-size:20px;font-weight:300;letter-spacing:-0.3px;font-family:'Segoe UI',Arial,sans-serif">CarboMétrica</div>
                        <div style="color:rgba(255,255,255,0.75);font-size:11px;font-style:italic;margin-top:1px;font-family:'Segoe UI',Arial,sans-serif">Expertos en medición de Huella de Carbono.</div>
                      </td>
                    </tr>
                  </table>
                </td>
                <td align="right"><span style="background:rgba(255,255,255,0.2);color:white;font-size:12px;padding:4px 12px;border-radius:999px">✅ Pago confirmado</span></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <p style="font-size:16px;color:#111827;font-weight:600;margin:0 0 8px">Hola, ${sale.companyName} 👋</p>
            <p style="font-size:14px;color:#6b7280;margin:0 0 24px">Confirmamos la recepción de tu pago por el servicio de CarboMetrics. Gracias por tu confianza.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;border:1px solid #e5e7eb;margin-bottom:24px">
              <tr><td style="padding:16px 20px;border-bottom:1px solid #f3f4f6">
                <table width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td style="font-size:12px;color:#9ca3af;text-transform:uppercase">Nº Recibo</td>
                  <td align="right" style="font-size:13px;font-weight:600;color:#111827;font-family:monospace">${sale.number}</td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:12px 20px;border-bottom:1px solid #f3f4f6">
                <table width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td style="font-size:13px;color:#6b7280">Plan contratado</td>
                  <td align="right" style="font-size:13px;font-weight:500;color:#111827">${planLabel}</td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:12px 20px;border-bottom:1px solid #f3f4f6">
                <table width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td style="font-size:13px;color:#6b7280">Período</td>
                  <td align="right" style="font-size:13px;color:#111827">${periodo}</td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:12px 20px;border-bottom:1px solid #f3f4f6">
                <table width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td style="font-size:13px;color:#6b7280">Subtotal</td>
                  <td align="right" style="font-size:13px;color:#111827">$${sale.subtotalUSD.toFixed(2)}</td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:12px 20px;border-bottom:1px solid #f3f4f6">
                <table width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td style="font-size:13px;color:#6b7280">IVA (13%)</td>
                  <td align="right" style="font-size:13px;color:#111827">$${sale.ivaUSD.toFixed(2)}</td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:16px 20px;background:#f0fdf4;border-radius:0 0 12px 12px">
                <table width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td style="font-size:15px;font-weight:700;color:#111827">Total pagado</td>
                  <td align="right" style="font-size:20px;font-weight:700;color:#16a34a">$${sale.totalUSD.toFixed(2)} USD</td>
                </tr></table>
              </td></tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
              <tr><td align="center">
                <a href="${receiptUrl}" style="display:inline-block;background:#16a34a;color:white;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px">📄 Ver recibo completo</a>
              </td></tr>
            </table>
            <div style="background:#f9fafb;border-radius:10px;padding:12px 16px;margin-bottom:20px;font-size:12px;color:#6b7280">
              <strong style="color:#374151">Datos para transferencia:</strong><br/>
              Banco FIE · Cuenta: [40014732669] · A nombre de: [CARLOS LEDEZMA BUSTAMANTE]<br/>
              <strong>Referencia: ${sale.number}</strong>
            </div>
            <p style="font-size:13px;color:#6b7280;margin:0 0 4px">¿Tenés alguna consulta? Escribinos a:</p>
            <p style="font-size:13px;color:#16a34a;margin:0">carbometrica@gmail.com</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #f3f4f6;text-align:center">
            <p style="font-size:11px;color:#9ca3af;margin:0">CarboMetrics · carbometrics.site · Cochabamba, Bolivia</p>
            <p style="font-size:11px;color:#d1d5db;margin:4px 0 0">Email automático — no respondas directamente a este mensaje.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      });
    } catch (emailError) {
      console.error("Error enviando email:", emailError);
    }
  }

  return c.json(sale);
});

export { router as salesRouter };
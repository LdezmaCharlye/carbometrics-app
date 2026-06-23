import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireManager } from "../middleware/auth";
import { v2 as cloudinary } from "cloudinary";

const router = new Hono();
const prismaFull = prisma;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function calcEmissions(qty: number, f: { kgCO2: number; kgCH4: number; kgN2O: number }) {
  return Math.round((qty * (f.kgCO2 + f.kgCH4 * 27.9 + f.kgN2O * 273)) * 1000) / 1000;
}

// GET /api/consumption/oldest-year
router.get("/oldest-year", requireAuth, async (c) => {
  const payload = c.get("jwtPayload") as any;
  const result  = await prisma.consumptionLog.findFirst({
    where:   { companyId: payload.companyId },
    orderBy: { year: "asc" },
    select:  { year: true },
  });
  return c.json({ year: result?.year ?? null });
});

// GET /api/consumption/summary
router.get("/summary", requireAuth, async (c) => {
  const payload   = c.get("jwtPayload") as any;
  const year      = parseInt(c.req.query("year") ?? String(new Date().getFullYear()));
  const branchId  = c.req.query("branchId") || undefined;
  const companyId = payload.companyId;
  if (!companyId) return c.json({ totalTCO2eq: 0, totalRecords: 0, byMonth: [] });

  const byMonth = branchId
    ? await prisma.$queryRaw<any[]>`
        SELECT
          cl.month,
          es.scope,
          SUM(cl."emissionsKgCO2eq") AS total_kg
        FROM consumption_logs cl
        JOIN emission_sources es ON es.id = cl."emissionSourceId"
        WHERE cl."companyId" = ${companyId}
          AND cl.year = ${year}
          AND cl."branchId" = ${branchId}
        GROUP BY cl.month, es.scope
        ORDER BY cl.month
      `
    : await prisma.$queryRaw<any[]>`
        SELECT
          cl.month,
          es.scope,
          SUM(cl."emissionsKgCO2eq") AS total_kg
        FROM consumption_logs cl
        JOIN emission_sources es ON es.id = cl."emissionSourceId"
        WHERE cl."companyId" = ${companyId}
          AND cl.year = ${year}
        GROUP BY cl.month, es.scope
        ORDER BY cl.month
      `;

  const totals = await prisma.consumptionLog.aggregate({
    where: branchId ? { companyId, year, branchId } : { companyId, year },
    _sum:   { emissionsKgCO2eq: true },
    _count: { id: true },
  });

  return c.json({
    year,
    totalKgCO2eq: totals._sum.emissionsKgCO2eq ?? 0,
    totalTCO2eq:  ((totals._sum.emissionsKgCO2eq ?? 0) / 1000),
    totalRecords: totals._count.id,
    byMonth,
  });
});

// GET /api/consumption
router.get("/", requireAuth, async (c) => {
  const payload = c.get("jwtPayload") as any;
  const page    = parseInt(c.req.query("page")  ?? "1");
  const limit   = parseInt(c.req.query("limit") ?? "50");
  const year    = c.req.query("year")  ? parseInt(c.req.query("year")!)  : undefined;
  const month   = c.req.query("month") ? parseInt(c.req.query("month")!) : undefined;

  const where: any = { companyId: payload.companyId };
  if (year)  where.year  = year;
  if (month) where.month = month;

  const [total, logs] = await Promise.all([
    prisma.consumptionLog.count({ where }),
    prisma.consumptionLog.findMany({
      where,
      skip:     (page - 1) * limit,
      take:     limit,
      orderBy:  [{ year: "desc" }, { month: "desc" }],
      include: {
        emissionSource:  { select: { id: true, name: true, scope: true, unit: true } },
        evidenceImages:  { select: { id: true, thumbnailUrl: true, url: true } },
      },
    }),
  ]);

  return c.json({ data: logs, pagination: { total, page, limit } });
});
// POST /api/consumption/from-factor — crea consumo directo desde factor global
router.post("/from-factor", requireManager, async (c) => {
  const payload = c.get("jwtPayload") as any;
  const body = await c.req.json().catch(() => null);
  if (!body || !body.emissionSourceId || !body.year || !body.month || !body.quantity) {
    return c.json({ error: "Faltan campos obligatorios" }, 400);
  }

  // Buscar la fuente directamente por ID
  const source = await prisma.emissionSource.findFirst({
    where: { id: body.emissionSourceId, companyId: payload.companyId, isActive: true },
    include: { emissionFactor: true },
  });
  if (!source) return c.json({ error: "Fuente no encontrada" }, 404);

  const factor = source.emissionFactor;
  const kgCO2 = factor?.kgCO2 ?? 0;
  const kgCH4 = factor?.kgCH4 ?? 0;
  const kgN2O = factor?.kgN2O ?? 0;

  const emissionsKgCO2eq = Math.round(
    parseFloat(body.quantity) * (kgCO2 + kgCH4 * 27.9 + kgN2O * 273) * 1000
  ) / 1000;

  const companyId = payload.companyId ?? source.companyId;

  const log = await prisma.consumptionLog.create({
    data: {
      emissionSourceId: source.id,
      year:             parseInt(body.year),
      month:            parseInt(body.month),
      quantity:         parseFloat(body.quantity),
      notes:            body.notes ?? null,
      dataQuality:      body.dataQuality ?? "ESTIMATED",
      emissionsKgCO2eq,
      companyId,
      branchId:         body.branchId || null,
      recordedById:     payload.sub,
    },
  });
  return c.json(log, 201);
});

// POST /api/consumption
const logSchema = z.object({
  emissionSourceId: z.string(),
  year:             z.number().int().min(2000).max(2100),
  month:            z.number().int().min(1).max(12),
  quantity:         z.number().positive(),
  notes:            z.string().optional(),
  dataQuality:      z.enum(["DIGITAL_INVOICE", "PHYSICAL_INVOICE", "MEASURED", "CALCULATED", "ESTIMATED"]).optional(),
  branchId:         z.string().optional(),
});

router.post("/", requireManager, async (c) => {
  const payload = c.get("jwtPayload") as any;
  const body    = await c.req.json().catch(() => null);
  const parsed  = logSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Datos inválidos", detail: parsed.error.flatten() }, 400);

  const source = await prisma.emissionSource.findFirst({
    where:   { id: parsed.data.emissionSourceId, companyId: payload.companyId },
    include: { emissionFactor: true },
  });
  if (!source) return c.json({ error: "Fuente de emisión no encontrada" }, 404);

  const emissionsKgCO2eq = source.emissionFactor
    ? calcEmissions(parsed.data.quantity, source.emissionFactor)
    : 0;

  const log = await prisma.consumptionLog.create({
    data: {
      ...parsed.data,
      dataQuality:  parsed.data.dataQuality ?? "ESTIMATED",
      emissionsKgCO2eq,
      companyId:    payload.companyId,
      recordedById: payload.sub,
    },
  });

  return c.json(log, 201);
});

// PATCH /api/consumption/:id/verify
router.patch("/:id/verify", requireAuth, async (c) => {
  const payload = c.get("jwtPayload") as any;
  const { id }  = c.req.param();

  const log = await prisma.consumptionLog.findFirst({
    where: { id, companyId: payload.companyId },
  });
  if (!log) return c.json({ error: "Registro no encontrado" }, 404);

  const body = await c.req.json().catch(() => ({}));
  const verificationNote = body.verificationNote ?? null;

  const updated = await prisma.consumptionLog.update({
    where: { id },
    data: {
      isVerified:       !log.isVerified,
      verifiedById:     null,
      verifiedAt:       !log.isVerified ? new Date()  : null,
      verificationNote: !log.isVerified ? verificationNote : null,
    },
    include: {
      verifiedBy: { select: { id: true, name: true, email: true } },
    },
  });
  return c.json(updated);
});

// GET /api/consumption/list
router.get("/list", requireAuth, async (c) => {
  const payload          = c.get("jwtPayload") as any;
  const year             = c.req.query("year")             ? parseInt(c.req.query("year")!)  : new Date().getFullYear();
  const month            = c.req.query("month")            ? parseInt(c.req.query("month")!) : undefined;
  const emissionFactorId = c.req.query("emissionFactorId") ?? undefined;
  const emissionSourceId = c.req.query("emissionSourceId") ?? undefined;
  const branchId          = c.req.query("branchId") || undefined;

  const where: any = { companyId: payload.companyId, year };
  if (month) where.month = month;
  if (branchId) where.branchId = branchId;
  if (emissionSourceId) {
    where.emissionSourceId = emissionSourceId;
  } else if (emissionFactorId) {
    where.emissionSource = { emissionFactorId };
  }

  const logs = await prisma.consumptionLog.findMany({
    where,
    orderBy: [{ month: "asc" }, { createdAt: "asc" }],
    include: {
      emissionSource: { select: { id: true, name: true, scope: true, unit: true } },
      recordedBy:     { select: { id: true, name: true } },
      verifiedBy:     { select: { id: true, name: true } },
      evidenceImages: { select: { id: true, url: true, thumbnailUrl: true, fileName: true } },
    },
  });
  return c.json(logs);
});

// GET /api/consumption/all-years
router.get("/all-years", requireAuth, async (c) => {
  const payload = c.get("jwtPayload") as any;
  const years = await prisma.consumptionLog.findMany({
    where:   { companyId: payload.companyId },
    select:  { year: true },
    distinct: ["year"],
    orderBy:  { year: "asc" },
  });
  return c.json({ years: years.map((y) => y.year) });
});

// GET /api/consumption/company-profile
router.get("/company-profile", requireAuth, async (c) => {
  const payload = c.get("jwtPayload") as any;
  if (!payload.companyId) return c.json({ error: "Sin empresa" }, 404);
  const company = await prisma.company.findUnique({
    where: { id: payload.companyId },
    select: {
      id: true, name: true, taxId: true, industry: true, country: true,
      orgBoundaryType: true, baseYear: true, baseYearRecalcNote: true,
      yearFrom: true, yearTo: true, licenseType: true,
      emissionSources: {
        select: {
          id: true, name: true, scope: true, category: true,
          uncertaintyLevel: true, uncertaintyNote: true,
          isExcluded: true, exclusionReason: true,
        },
        orderBy: [{ scope: "asc" }, { name: "asc" }],
      },
    },
  });
  if (!company) return c.json({ error: "Empresa no encontrada" }, 404);
  return c.json(company);
});

// ─── REPORTES PÚBLICOS (QR) ────────────────────────────────────────────────

// POST /api/consumption/reports/generate — genera/actualiza la ficha pública de reporte
router.post("/reports/generate", requireAuth, async (c) => {
  const payload = c.get("jwtPayload") as any;
  const body = await c.req.json().catch(() => null);
  if (!body || !body.data) return c.json({ error: "Faltan datos" }, 400);

  const branchId   = body.branchId || "";
  const branchName = body.branchName || null;

  try {
    const report = await prisma.publicReport.upsert({
      where:  { companyId_branchId: { companyId: payload.companyId, branchId } },
      update: { data: body.data, branchName, pdfUrl: null },
      create: { companyId: payload.companyId, branchId, branchName, data: body.data },
    });
    return c.json({ id: report.id, generatedAt: report.generatedAt });
  } catch (error) {
    console.error("Error generando reporte público:", error);
    return c.json({ error: "Error al generar el reporte" }, 500);
  }
});

// POST /api/consumption/reports/upload-pdf/:id — sube el PDF generado y lo asocia al reporte
router.post("/reports/upload-pdf/:id", requireAuth, async (c) => {
  const payload = c.get("jwtPayload") as any;
  const { id } = c.req.param();

  const report = await prisma.publicReport.findFirst({ where: { id, companyId: payload.companyId } });
  if (!report) return c.json({ error: "Reporte no encontrado" }, 404);

  try {
    const formData = await c.req.formData();
    const file = formData.get("pdf") as File;
    if (!file) return c.json({ error: "Sin archivo" }, 400);

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const dataUri = `data:application/pdf;base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "carbometrics/reports",
      resource_type: "raw",
      public_id: `report-${id}`,
      overwrite: true,
    });

    const updated = await prisma.publicReport.update({
      where: { id },
      data: { pdfUrl: result.secure_url },
    });

    return c.json({ pdfUrl: updated.pdfUrl });
  } catch (error) {
    console.error("Error subiendo PDF:", error);
    return c.json({ error: "Error al subir el PDF" }, 500);
  }
});

// GET /api/consumption/reports/public/:id — vista pública, sin autenticación
router.get("/reports/public/:id", async (c) => {
  const { id } = c.req.param();
  try {
    const report = await prisma.publicReport.findUnique({ where: { id } });
    if (!report) return c.json({ error: "Reporte no encontrado" }, 404);
    return c.json({ data: report.data, branchName: report.branchName, generatedAt: report.generatedAt, pdfUrl: report.pdfUrl });
  } catch (error) {
    return c.json({ error: "Error al obtener el reporte" }, 500);
  }
});

// ─── REMOCIONES Y SUMIDEROS ───────────────────────────────────────────────

// GET /api/consumption/removals-by-company
router.get("/removals-by-company", requireAuth, async (c) => {
  const payload = c.get("jwtPayload") as any;
  const yearParam = c.req.query("year");

  try {
    let removals: any[];
    if (yearParam) {
      const year = parseInt(yearParam);
      removals = await prisma.$queryRaw`
        SELECT * FROM removal_projects
        WHERE "companyId" = ${payload.companyId}
          AND "startYear" <= ${year}
          AND ("endYear" IS NULL OR "endYear" >= ${year})
        ORDER BY "createdAt" DESC
      `;
    } else {
      removals = await prisma.$queryRaw`
        SELECT * FROM removal_projects
        WHERE "companyId" = ${payload.companyId}
        ORDER BY "createdAt" DESC
      `;
    }
    return c.json({ success: true, data: removals });
  } catch (error) {
    console.error("Error removals-by-company:", error);
    return c.json({ success: false, error: "Error al obtener remociones" }, 500);
  }
});

// GET /api/consumption/removals/:companyId (admin)
router.get("/removals/:companyId", requireAuth, async (c) => {
  const { companyId } = c.req.param();
  const yearParam = c.req.query("year");

  try {
    const where: any = { companyId };
    if (yearParam) {
      const year = parseInt(yearParam);
      where.startYear = { lte: year };
      where.OR = [{ endYear: null }, { endYear: { gte: year } }];
    }
    const removals = await (prisma as any).removalProject.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return c.json({ success: true, data: removals });
  } catch (error) {
    return c.json({ success: false, error: "Error al obtener remociones" }, 500);
  }
});

// POST /api/consumption/removals
router.post("/removals", requireManager, async (c) => {
  const payload = c.get("jwtPayload") as any;
  const body = await c.req.json().catch(() => null);

  if (!body || !body.name || !body.type || !body.startYear || !body.tCO2eRemovedPerYear) {
    return c.json({ success: false, error: "Faltan campos obligatorios" }, 400);
  }

  try {
    const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const startYear = parseInt(body.startYear);
    const endYear = body.endYear ? parseInt(body.endYear) : null;
    const tCO2e = parseFloat(body.tCO2eRemovedPerYear);
    const name = body.name;
    const description = body.description ?? null;
    const type = body.type;
    const methodology = body.methodology ?? null;
    const verificationBody = body.verificationBody ?? null;
    const notes = body.notes ?? null;
    const companyId = payload.companyId;

    await prisma.$executeRaw`
      INSERT INTO removal_projects (id, name, description, type, methodology, "startYear", "endYear", "tCO2eRemovedPerYear", "verificationBody", status, notes, "createdAt", "updatedAt", "companyId")
      VALUES (${id}, ${name}, ${description}, ${type}, ${methodology}, ${startYear}, ${endYear}, ${tCO2e}, ${verificationBody}, 'ACTIVE', ${notes}, NOW(), NOW(), ${companyId})
    `;

    return c.json({ success: true, data: { id, name, type, startYear, endYear, tCO2eRemovedPerYear: tCO2e } }, 201);
  } catch (error) {
    console.error("Error crear remoción:", error);
    return c.json({ success: false, error: "Error al crear remoción" }, 500);
  }
});

// PATCH /api/consumption/removals/:id
router.patch("/removals/:id", requireManager, async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ success: false, error: "Sin datos" }, 400);

  try {
    const name = body.name;
    const description = body.description ?? null;
    const type = body.type;
    const methodology = body.methodology ?? null;
    const startYear = body.startYear ? parseInt(body.startYear) : null;
    const endYear = body.endYear ? parseInt(body.endYear) : null;
    const tCO2e = body.tCO2eRemovedPerYear ? parseFloat(body.tCO2eRemovedPerYear) : null;
    const verificationBody = body.verificationBody ?? null;
    const status = body.status ?? "ACTIVE";
    const notes = body.notes ?? null;

    await prisma.$executeRaw`
      UPDATE removal_projects
      SET name = ${name},
          description = ${description},
          type = ${type},
          methodology = ${methodology},
          "startYear" = ${startYear},
          "endYear" = ${endYear},
          "tCO2eRemovedPerYear" = ${tCO2e},
          "verificationBody" = ${verificationBody},
          status = ${status},
          notes = ${notes},
          "updatedAt" = NOW()
      WHERE id = ${id}
    `;
    return c.json({ success: true, data: { id, name, type } });
  } catch (error) {
    console.error("Error actualizar remoción:", error);
    return c.json({ success: false, error: "Error al actualizar remoción" }, 500);
  }
});

// DELETE /api/consumption/:id
router.delete("/:id", requireManager, async (c) => {
  const payload = c.get("jwtPayload") as any;
  const { id } = c.req.param();
  try {
    const log = await prisma.consumptionLog.findFirst({
      where: { id, companyId: payload.companyId },
    });
    if (!log) return c.json({ error: "Registro no encontrado" }, 404);
    await prisma.consumptionLog.delete({ where: { id } });
    return c.json({ success: true });
  } catch (error) {
    console.error("Error eliminar consumo:", error);
    return c.json({ error: "Error al eliminar" }, 500);
  }
});

// PATCH /api/consumption/:id — editar registro
router.patch("/:id", requireManager, async (c) => {
  const payload = c.get("jwtPayload") as any;
  const { id } = c.req.param();
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: "Sin datos" }, 400);
  try {
    const log = await prisma.consumptionLog.findFirst({
      where: { id, companyId: payload.companyId },
    });
    if (!log) return c.json({ error: "Registro no encontrado" }, 404);
    const updated = await prisma.consumptionLog.update({
      where: { id },
      data: {
        quantity: body.quantity ?? log.quantity,
        notes: body.notes ?? log.notes,
        dataQuality: body.dataQuality ?? log.dataQuality,
      },
    });
    return c.json(updated);
  } catch (error) {
    console.error("Error actualizar consumo:", error);
    return c.json({ error: "Error al actualizar" }, 500);
  }
});

// PATCH /api/consumption/:id/verify
router.patch("/:id/verify", requireManager, async (c) => {
  const payload = c.get("jwtPayload") as any;
  const { id } = c.req.param();
  try {
    const log = await prisma.consumptionLog.findFirst({
      where: { id, companyId: payload.companyId },
    });
    if (!log) return c.json({ error: "Registro no encontrado" }, 404);
    const updated = await prisma.consumptionLog.update({
      where: { id },
      data: {
        isVerified: !log.isVerified,
        verifiedAt: !log.isVerified ? new Date() : null,
      },
    });
    return c.json(updated);
  } catch (error) {
    return c.json({ error: "Error al verificar" }, 500);
  }
});
router.delete("/removals/:id", requireManager, async (c) => {
  const { id } = c.req.param();
  try {
    await prisma.$executeRaw`
      DELETE FROM removal_projects WHERE id = ${id}
    `;
    return c.json({ success: true, message: "Remoción eliminada" });
  } catch (error) {
    console.error("Error eliminar remoción:", error);
    return c.json({ success: false, error: "Error al eliminar remoción" }, 500);
  }
});

export { router as consumptionRouter };
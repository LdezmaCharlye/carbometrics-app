import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth";
import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";

const router = new Hono();
const prisma = new PrismaClient();

// Carpeta donde se guardan las imágenes
const UPLOADS_DIR = path.join(process.cwd(), "uploads", "evidence");

// Crear carpeta si no existe
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// POST /api/upload/evidence/:logId
router.post("/evidence/:logId", requireAuth, async (c) => {
  const payload   = c.get("jwtPayload") as any;
  const { logId } = c.req.param();

  // Verificar que el log pertenece a la empresa
  const log = await prisma.consumptionLog.findFirst({
    where: { id: logId, companyId: payload.companyId },
  });
  if (!log) return c.json({ error: "Registro no encontrado" }, 404);

  try {
    const formData = await c.req.formData();
    const files    = formData.getAll("images") as File[];

    if (!files || files.length === 0) {
      return c.json({ error: "No se recibieron archivos" }, 400);
    }

    const saved = [];

    for (const file of files) {
      const buffer   = await file.arrayBuffer();
      const bytes    = new Uint8Array(buffer);
      const ext      = file.name.split(".").pop() ?? "jpg";
      const fileName = `${logId}_${Date.now()}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, fileName);

      const isImage = ["jpg","jpeg","png","webp"].includes(ext.toLowerCase());
      if (isImage) {
        await sharp(Buffer.from(buffer))
          .resize({ width: 500, withoutEnlargement: true })
          .jpeg({ quality: 40 })
          .toFile(filePath);
      } else {
        fs.writeFileSync(filePath, bytes);
      }

      // URL pública del archivo
      const fileUrl = `/uploads/evidence/${fileName}`;

      // Guardar en BD
      const evidence = await prisma.evidenceImage.create({
        data: {
          consumptionLogId: logId,
          cloudinaryId:     fileName,
          url:              fileUrl,
          thumbnailUrl:     fileUrl,
          fileName:         file.name,
          fileSize:         file.size,
          mimeType:         file.type || "image/jpeg",
        },
      });

      saved.push(evidence);
    }

    return c.json({ uploaded: saved.length, files: saved });
  } catch (err) {
    console.error("Upload error:", err);
    return c.json({ error: "Error al subir archivo" }, 500);
  }
});

// GET /api/upload/evidence/:logId — listar imágenes de un registro
router.get("/evidence/:logId", requireAuth, async (c) => {
  const payload   = c.get("jwtPayload") as any;
  const { logId } = c.req.param();

  const log = await prisma.consumptionLog.findFirst({
    where:   { id: logId, companyId: payload.companyId },
    include: { evidenceImages: true },
  });
  if (!log) return c.json({ error: "No encontrado" }, 404);

  return c.json(log.evidenceImages);
});

export { router as uploadRouter };
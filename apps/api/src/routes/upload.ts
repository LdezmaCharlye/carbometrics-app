import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth";
import { v2 as cloudinary } from "cloudinary";

const router = new Hono();
const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST /api/upload/evidence/:logId
router.post("/evidence/:logId", requireAuth, async (c) => {
  const payload   = c.get("jwtPayload") as any;
  const { logId } = c.req.param();

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
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const dataUri = `data:${file.type || "image/jpeg"};base64,${base64}`;

      const result = await cloudinary.uploader.upload(dataUri, {
        folder:         "carbometrics/evidence",
        transformation: [
          { width: 800, height: 1200, crop: "limit" },
          { quality: 65 },
          { fetch_format: "auto" },
        ],
        resource_type: "image",
      });

      const evidence = await prisma.evidenceImage.create({
        data: {
          consumptionLogId: logId,
          cloudinaryId:     result.public_id,
          url:              result.secure_url,
          thumbnailUrl:     result.secure_url.replace("/upload/", "/upload/w_200,h_200,c_fill/"),
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

// GET /api/upload/evidence/:logId
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
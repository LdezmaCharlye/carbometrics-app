import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authRouter }  from "./routes/auth";
import { adminRouter } from "./routes/admin";
import { consumptionRouter } from "./routes/consumption";
import { sourcesRouter } from "./routes/emission-sources";
import { uploadRouter } from "./routes/upload";

const app = new Hono();

app.use("*", logger());
app.use("*", cors({
  origin: [
    "http://localhost:3000",
    "https://carbometrics.site",
    "https://www.carbometrics.site",
    "https://carbometrics-app-web-git-main-charlye-s-projects.vercel.app",
    ...(process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : []),
  ],
  credentials: true,
}));

app.get("/", (c) => c.json({
  name:    "CarboMetrics API",
  version: "0.1.0",
  status:  "ok",
}));

app.get("/health", (c) => c.json({
  status:    "ok",
  timestamp: new Date().toISOString(),
}));

app.route("/api/auth",  authRouter);

// Ruta pública de licencia — fuera del middleware de superadmin
app.get("/api/admin/my-license", async (c) => {
  const { PrismaClient } = await import("@prisma/client");
  const jwt = await import("jsonwebtoken");
  const prisma = new PrismaClient();

  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return c.json({ error: "No autorizado" }, 401);

  try {
    const payload = jwt.default.verify(
      authHeader.slice(7),
      process.env.JWT_SECRET ?? "dev-secret"
    ) as any;

    if (!payload.companyId) return c.json({ licenseExpiresAt: null });

    const company = await prisma.company.findUnique({
      where:  { id: payload.companyId },
      select: { licenseExpiresAt: true, isActive: true, name: true },
    });
    await prisma.$disconnect();
    return c.json(company ?? { licenseExpiresAt: null });
  } catch {
    await prisma.$disconnect();
    return c.json({ error: "Token inválido" }, 401);
  }
});

app.route("/api/admin", adminRouter);
app.route("/api/consumption", consumptionRouter);
app.route("/api/sources", sourcesRouter);
app.route("/api/upload", uploadRouter);
// Servir imágenes subidas localmente
app.use("/uploads/*", async (c) => {
  const { serveStatic } = await import("@hono/node-server/serve-static");
  return serveStatic({ root: "./" })(c, () => Promise.resolve());
});
app.notFound((c) => c.json({ error: "Ruta no encontrada" }, 404));

const port = parseInt(process.env.API_PORT ?? "3001");

serve({ fetch: app.fetch, port }, () => {
  console.log(`\n🌿 CarboMetrics API corriendo en http://localhost:${port}\n`);
});
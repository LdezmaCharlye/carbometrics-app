import { Hono } from "hono";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { signToken, requireAuth } from "../middleware/auth";

const router = new Hono();
const prisma = new PrismaClient();

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
});

router.post("/login", async (c) => {
  const body   = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Datos inválidos" }, 400);
  }

  const { email, password } = parsed.data;

  const superAdmin = await prisma.superAdmin.findUnique({ where: { email } });
  if (superAdmin) {
    const ok = await bcrypt.compare(password, superAdmin.passwordHash);
    if (!ok) return c.json({ error: "Credenciales incorrectas" }, 401);
    const token = signToken({ sub: superAdmin.id, role: "SUPERADMIN" });
    return c.json({
      token,
      user: {
        id:    superAdmin.id,
        name:  superAdmin.name,
        email: superAdmin.email,
        role:  "SUPERADMIN",
      },
    });
  }

  const user = await prisma.user.findUnique({
    where:   { email },
    include: { company: { select: { id: true, name: true, isActive: true } } },
  });

  if (!user) return c.json({ error: "Credenciales incorrectas" }, 401);
  if (!user.isActive) return c.json({ error: "Tu cuenta está desactivada." }, 403);
  if (!user.company.isActive) return c.json({ error: "La licencia expiró." }, 403);

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return c.json({ error: "Credenciales incorrectas" }, 401);

  await prisma.user.update({
    where: { id: user.id },
    data:  { lastLoginAt: new Date() },
  });

  const token = signToken({
    sub:       user.id,
    role:      user.role as "MANAGER" | "VIEWER",
    companyId: user.companyId,
    branchId:  user.branchId ?? undefined,
  });

  return c.json({
    token,
    mustChangePassword: user.mustChangePassword,
    termsAccepted: !!user.termsAcceptedAt,
    user: {
      id:        user.id,
      name:      user.name,
      email:     user.email,
      role:      user.role,
      companyId: user.companyId,
      company:   user.company.name,
    },
  });
});

router.get("/me", requireAuth, async (c) => {
  const payload = c.get("jwtPayload") as any;

  if (payload.role === "SUPERADMIN") {
    const sa = await prisma.superAdmin.findUnique({ where: { id: payload.sub } });
    if (!sa) return c.json({ error: "No encontrado" }, 404);
    return c.json({ id: sa.id, name: sa.name, email: sa.email, role: "SUPERADMIN" });
  }

  const user = await prisma.user.findUnique({
    where:   { id: payload.sub },
    include: { company: { select: { id: true, name: true } } },
  });
  if (!user) return c.json({ error: "No encontrado" }, 404);
  return c.json({
    id:                user.id,
    name:              user.name,
    email:             user.email,
    role:              user.role,
    company:           user.company,
    mustChangePassword: user.mustChangePassword,
  });
});
// POST /api/auth/change-password
router.post("/change-password", requireAuth, async (c) => {
  const payload = c.get("jwtPayload") as any;
  const body    = await c.req.json().catch(() => null);
  const schema  = z.object({
    currentPassword: z.string(),
    newPassword:     z.string().min(8),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Datos inválidos" }, 400);

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) return c.json({ error: "Usuario no encontrado" }, 404);

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!ok) return c.json({ error: "Contraseña actual incorrecta" }, 400);

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data:  { passwordHash: newHash, mustChangePassword: false },
  });

  return c.json({ message: "Contraseña actualizada correctamente" });
});
router.post("/accept-terms", requireAuth, async (c) => {
  const payload = c.get("jwtPayload") as any;
  try {
    const user = await prisma.user.findUnique({
      where:   { id: payload.sub },
      include: { company: { select: { name: true } } },
    });
    if (!user) return c.json({ error: "Usuario no encontrado" }, 404);

    const ip        = c.req.header("x-forwarded-for")?.split(",")[0]?.trim()
                   ?? c.req.header("x-real-ip")
                   ?? "desconocida";
    const userAgent = c.req.header("user-agent") ?? "desconocido";

    await prisma.user.update({
      where: { id: payload.sub },
      data:  { termsAcceptedAt: new Date() },
    });

    await prisma.termsAcceptanceLog.create({
      data: {
        userId:       user.id,
        userName:     user.name,
        userEmail:    user.email,
        companyId:    user.companyId,
        companyName:  user.company.name,
        ipAddress:    ip,
        userAgent:    userAgent,
        termsVersion: "v1.0-junio-2026",
      },
    });

    return c.json({ ok: true });
  } catch (e) {
    return c.json({ error: "Error al guardar aceptación" }, 500);
  }
});

export { router as authRouter };
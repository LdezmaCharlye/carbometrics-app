import { Context, Next } from "hono";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";

export interface JwtPayload {
  sub:        string;
  role:       "SUPERADMIN" | "MANAGER" | "VIEWER";
  companyId?: string;
  branchId?:  string;
}

function extractToken(c: Context): JwtPayload | null {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(header.slice(7), JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export async function requireAuth(c: Context, next: Next) {
  const payload = extractToken(c);
  if (!payload) return c.json({ error: "No autorizado. Token requerido." }, 401);
  c.set("jwtPayload", payload);

  // Verificar licencia vencida (solo para usuarios de empresa, no superadmin)
  if (payload.role !== "SUPERADMIN" && payload.companyId) {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    const company = await prisma.company.findUnique({
      where:  { id: payload.companyId },
      select: { isActive: true, licenseExpiresAt: true },
    });
    await prisma.$disconnect();

    if (!company?.isActive) {
      return c.json({ error: "COMPANY_INACTIVE", message: "Tu empresa está desactivada. Contacta al administrador." }, 403);
    }
    if (company?.licenseExpiresAt && new Date(company.licenseExpiresAt) < new Date()) {
      return c.json({ error: "LICENSE_EXPIRED", message: "La licencia de tu empresa ha vencido. Contacta al administrador." }, 403);
    }
  }

  await next();
}

export async function requireSuperAdmin(c: Context, next: Next) {
  const payload = extractToken(c);
  if (!payload) return c.json({ error: "No autorizado." }, 401);
  if (payload.role !== "SUPERADMIN") {
    return c.json({ error: "Acceso denegado. Solo SuperAdmin." }, 403);
  }
  c.set("jwtPayload", payload);
  await next();
}

export async function requireManager(c: Context, next: Next) {
  const payload = extractToken(c);
  if (!payload) return c.json({ error: "No autorizado." }, 401);
  if (!["SUPERADMIN", "MANAGER"].includes(payload.role)) {
    return c.json({ error: "Acceso denegado. Se requiere Manager." }, 403);
  }
  c.set("jwtPayload", payload);
  await next();
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  });
}
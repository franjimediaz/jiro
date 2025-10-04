import { NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type LoginBody = { email?: unknown; password?: unknown };

export async function POST(req: Request) {
  try {
    // 0) LOG ENV BÁSICO (no logueamos secretos, solo si hay o no)
    const hasDB = !!process.env.DATABASE_URL;
    const hasJWT = !!process.env.JWT_SECRET;
    console.log("[/api/login] env", { hasDB, hasJWT });

    // 1) Leer body y validar
    const body: LoginBody = await req.json().catch((e) => {
      console.error("[/api/login] JSON parse error:", e);
      throw new Error("BODY_INVALIDO");
    });
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña obligatorios" },
        { status: 400 }
      );
    }

    // 2) Comprobar conexión DB con una consulta trivial
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      console.error("[/api/login] DB connection error:", e);
      return NextResponse.json({ error: "DB_NO_DISPONIBLE" }, { status: 500 });
    }

    // 3) Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: { rol: true },
    });

    if (!usuario || !usuario.activo) {
      return NextResponse.json(
        { error: "Usuario no encontrado o inactivo" },
        { status: 401 }
      );
    }

    if (!usuario.passwordHash) {
      console.error("[/api/login] Usuario sin passwordHash", {
        id: usuario.id,
        email: usuario.email,
      });
      return NextResponse.json(
        { error: "Credenciales incorrectas" },
        { status: 401 }
      );
    }

    // 4) Comparar contraseña
    const ok = await bcrypt.compare(password, usuario.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Contraseña incorrecta" },
        { status: 401 }
      );
    }

    // 5) Firmar JWT (si no hay JWT_SECRET, usamos fallback pero lo LOGUEAMOS)
    const secret = process.env.JWT_SECRET || "cambia-esto-en-vercel";
    if (!process.env.JWT_SECRET) {
      console.warn(
        "[/api/login] WARNING: usando JWT_SECRET de fallback, configura JWT_SECRET en Vercel"
      );
    }

    const token = jwt.sign(
      { id: usuario.id, rolId: usuario.rolId, rolNombre: usuario.rol?.nombre },
      secret,
      { expiresIn: "1d" }
    );

    // 6) Responder + cookie
    const res = NextResponse.json({
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rolId: usuario.rolId,
        rolNombre: usuario.rol?.nombre,
      },
    });

    res.cookies.set("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return res;
  } catch (err: any) {
    console.error("❌ [/api/login] ERROR:", err?.message, err?.stack);
    // TEMPORAL: expón el mensaje para ver el fallo durante diagnóstico
    return NextResponse.json(
      { error: err?.message || "Error interno" },
      { status: 500 }
    );
  }
}

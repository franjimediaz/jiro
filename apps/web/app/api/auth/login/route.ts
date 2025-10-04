import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Utilidad: decidir si un error es "de DB" o no
function esErrorDeBD(e: any): boolean {
  const code = e?.code ?? "";
  const name = e?.name ?? "";
  const msg = (e?.message ?? "").toLowerCase();

  // Errores típicos Prisma/DB en serverless
  if (code.startsWith("P10")) return true; // P1000, P1001, etc.
  if (name.includes("PrismaClientInitializationError")) return true;
  if (msg.includes("connect") || msg.includes("timeout")) return true;
  if (msg.includes("certificate") || msg.includes("ssl")) return true;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    // 1) Pre-chequeo de config
    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { error: "CONFIG_FALTANTE", detalle: "JWT_SECRET no definido" },
        { status: 500 }
      );
    }

    // 2) Body y validación mínima
    const body = await req.json().catch(() => ({}));
    const email: string = body?.email?.toString().trim() ?? "";
    const password: string = body?.password?.toString() ?? "";

    if (!email || !password) {
      return NextResponse.json(
        {
          error: "DATOS_INVALIDOS",
          detalle: "email y password son requeridos",
        },
        { status: 400 }
      );
    }

    // 3) Buscar usuario
    const user = await prisma.usuario.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "CREDENCIALES_INVALIDAS" },
        { status: 401 }
      );
    }

    // 4) Comparar password
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "CREDENCIALES_INVALIDAS" },
        { status: 401 }
      );
    }

    // 5) Firmar token
    const token = jwt.sign(
      { id: user.id, rolId: user.rolId },
      process.env.JWT_SECRET as string,
      { expiresIn: "2h" }
    );

    // (Opcional) Set cookie httpOnly. Si no usas cookie, devuelve el token en el body.
    const res = NextResponse.json({ ok: true, token });
    // res.cookies.set("auth", token, {
    //   httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 60 * 60 * 2
    // });
    return res;
  } catch (e: any) {
    // Mapeo fino: solo DB → DB_NO_DISPONIBLE; el resto, error real
    if (esErrorDeBD(e)) {
      return NextResponse.json(
        {
          error: "DB_NO_DISPONIBLE",
          code: e?.code ?? "",
          msg: e?.message ?? "",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "ERROR_LOGIN", code: e?.code ?? "", msg: e?.message ?? "" },
      { status: 500 }
    );
  }
}

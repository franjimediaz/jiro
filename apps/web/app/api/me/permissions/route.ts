// apps/web/app/api/me/permissions/route.ts
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/server/auth/session";
import { loadPermisosMapa } from "@/server/auth/permisos";

export const dynamic = "force-dynamic";

/**
 * GET /api/me/permissions
 * Responde: { usuario: {id, nombre, rol}, permisos: PermisosMapa }
 * - 401 si no hay sesión.
 */
export async function GET() {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const permisos = await loadPermisosMapa(user.id);

    return NextResponse.json({
      ok: true,
      usuario: { id: user.id, nombre: user.nombre, rol: user.rol },
      permisos,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// apps/web/server/auth/permisos.ts
import { prisma } from "@/lib/prisma";

// Estructura que espera tu <PermisosProvider/>
export type PermisosMapa = Record<string, Record<string, boolean>>;

/**
 * Obtiene permisos "normalizados" por { [modulo]: { [accion]: boolean } }
 * a partir de tu modelo en PostgreSQL vía Prisma.
 *
 * Ajusta las consultas a tu esquema real:
 * - Tabla usuarios -> roles
 * - Tabla role_permisos -> (modulo, accion)
 */
export async function loadPermisosMapa(userId: number): Promise<PermisosMapa> {
  // ⚠️ DEMO: intenta deducir la estructura típica
  // usuario -> rol -> role_permisos(modulo, accion)

  // 1) Rol(es) del usuario
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          permisos: true, // asumiendo Role { permisos: RolePermiso[] }
        },
      },
    },
  });

  const mapa: PermisosMapa = {};

  // Si no tienes ese modelo, cambia esta parte a tu realidad:
  if (!usuario?.roles?.length) {
    return mapa;
  }

  for (const rol of usuario.roles) {
    for (const rp of rol.permisos || []) {
      const modulo = String((rp as any).modulo || "")
        .trim()
        .toLowerCase();
      const accion = String((rp as any).accion || "")
        .trim()
        .toLowerCase();
      if (!modulo || !accion) continue;

      if (!mapa[modulo]) mapa[modulo] = {};
      mapa[modulo][accion] = true;
    }
  }

  // Opcional: comodines (*) → expandir
  // p. ej. si guardas 'ver'/'crear'... bajo accion='*'
  Object.keys(mapa).forEach((mod) => {
    if (mapa[mod]["*"]) {
      mapa[mod]["ver"] = true;
      mapa[mod]["crear"] = true;
      mapa[mod]["actualizar"] = true;
      mapa[mod]["eliminar"] = true;
    }
  });

  return mapa;
}

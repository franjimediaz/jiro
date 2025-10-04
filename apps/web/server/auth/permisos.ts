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
  // usuario -> rol -> role_permisos(modulo, accion)
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

  if (!usuario?.roles?.length) return mapa;

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

  // ✅ Comodines (*) → expandir de forma segura y sin warnings
  const ACCIONES = ["ver", "crear", "actualizar", "eliminar"] as const;

  for (const mod of Object.keys(mapa)) {
    // Asegura que el objeto existe y permite leer "*"
    const modPerms = (mapa[mod] ??= {});
    const modPermsAny = modPerms as Record<string, boolean>;

    if (modPermsAny["*"]) {
      ACCIONES.forEach((accion) => {
        modPerms[accion] = true;
      });
      delete modPermsAny["*"]; // Limpieza opcional
    }
  }

  return mapa;
}

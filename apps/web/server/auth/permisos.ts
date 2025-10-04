import { prisma } from "@/lib/prisma";

export type PermisosMapa = Record<string, Record<string, boolean>>;

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

  const ACCIONES = ["ver", "crear", "actualizar", "eliminar"] as const;

  for (const mod of Object.keys(mapa)) {
    const modPerms = (mapa[mod] ??= {});
    const modPermsAny = modPerms as Record<string, boolean>;

    if (modPermsAny["*"]) {
      ACCIONES.forEach((accion) => {
        modPerms[accion] = true;
      });
      delete modPermsAny["*"];
    }
  }

  return mapa;
}

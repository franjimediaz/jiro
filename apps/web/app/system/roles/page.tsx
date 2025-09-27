"use client";

import { useEffect, useState } from "react";
import { TablaListado } from "@repo/ui";
import styles from "./Roles.module.css";
import { useRouter } from "next/navigation";
import { Columna } from "@repo/shared/types";
import { RequirePermiso, usePermisos } from "../../lib/permisos";

type Rol = {
  id: number;
  nombre: string;
  nivel: number;
  activo: boolean;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

export default function RolesPage() {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { can } = usePermisos();

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await fetch(`${API_BASE}/roles`, {
          credentials: "include",
        });
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        const data = await res.json();
        setRoles(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error al obtener Roles:", err);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [router]);

  const handleEliminar = async (rol: Rol) => {
    if (!can("roles", "eliminar")) {
      router.replace("/403");
      return;
    }
    if (!confirm(`¿Eliminar rol "${rol.nombre}"?`)) return;

    try {
      const res = await fetch(`${API_BASE}/roles/${rol.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("No se pudo eliminar");
      setRoles((prev) => prev.filter((r) => r.id !== rol.id));
      alert("Rol eliminado");
    } catch (e) {
      alert("Error al eliminar");
    }
  };

  const columnas: Columna[] = [
    { clave: "nombre", encabezado: "Nombre" },
    { clave: "nivel", encabezado: "Nivel" },
    { clave: "activo", encabezado: "Activo", tipo: "checkbox" },
  ];

  const onVer = (rol: Rol) => router.push(`/system/roles/${rol.id}`);
  const onEditar = can("roles", "editar")
    ? (rol: Rol) => router.push(`/system/roles/${rol.id}?edit=true`)
    : undefined;
  const onEliminar = can("roles", "eliminar") ? handleEliminar : undefined;

  return (
    <RequirePermiso modulo="roles" accion="ver" fallback={null}>
      <main>
        <div className={styles.RolesContainer}>
          <div className={styles.header}>
            <h1>Listado de Roles</h1>
            {can("roles", "crear") && (
              <button
                className={styles.botonCrear}
                onClick={() => router.push("/system/roles/create")}
              >
                + Crear Rol
              </button>
            )}
          </div>

          {loading ? (
            <p>Cargando Roles...</p>
          ) : (
            <TablaListado
              titulo=""
              columnas={columnas}
              datos={roles}
              onVer={onVer}
              onEditar={onEditar}
              onEliminar={onEliminar}
              mostrarImportar={false}
            />
          )}
        </div>
      </main>
    </RequirePermiso>
  );
}

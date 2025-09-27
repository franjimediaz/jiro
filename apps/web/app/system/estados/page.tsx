"use client";

import { useEffect, useState } from "react";
import { TablaListado } from "@repo/ui";
import styles from "./Estados.module.css";
import { useRouter } from "next/navigation";
import { RequirePermiso, usePermisos } from "../../lib/permisos";

type Estado = {
  id: number;
  nombre: string;
  color?: string;
  icono?: string;
};

export default function EstadosPage() {
  const [estados, setEstados] = useState<Estado[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { can } = usePermisos();

  const puedeCrear = can("estados", "crear");
  const puedeEditar = can("estados", "editar");
  const puedeEliminar = can("estados", "eliminar");

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/estados`, {
          credentials: "include",
        });

        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (res.status === 403) {
          router.replace("/403");
          return;
        }

        const data = await res.json();
        setEstados(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error al obtener Estados:", err);
        setEstados([]);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [router]);

  const handleEliminar = async (estado: Estado) => {
    if (!puedeEliminar) {
      alert("No tienes permiso para eliminar estados.");
      return;
    }
    if (!confirm(`¿Eliminar estado "${estado.nombre}"?`)) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/estados/${estado.id}`,
        { method: "DELETE", credentials: "include" }
      );

      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (res.status === 403) {
        router.replace("/403");
        return;
      }

      if (res.ok) {
        setEstados((prev) => prev.filter((e) => e.id !== estado.id));
        alert("Estado eliminado");
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`Error al eliminar: ${data?.error || res.statusText}`);
      }
    } catch (e) {
      console.error(e);
      alert("Error de red al eliminar");
    }
  };

  const columnas = [
    { clave: "nombre", encabezado: "Nombre" },
    { clave: "color", encabezado: "Color" },
    { clave: "icono", encabezado: "Icono" },
  ];

  return (
    <RequirePermiso modulo="estados" accion="ver" fallback={null}>
      <main>
        <div className={styles.EstadosContainer}>
          <div className={styles.header}>
            <h1>Listado de Estados</h1>
            {puedeCrear && (
              <button
                className={styles.botonCrear}
                onClick={() => router.push("/system/estados/create")}
              >
                + Crear Estado
              </button>
            )}
          </div>

          {loading ? (
            <p>Cargando Estados...</p>
          ) : (
            <TablaListado
              titulo=""
              columnas={columnas}
              datos={estados}
              onVer={(estado) => router.push(`/system/estados/${estado.id}`)}
              onEditar={
                puedeEditar
                  ? (estado) =>
                      router.push(`/system/estados/${estado.id}?edit=true`)
                  : undefined
              }
              onEliminar={puedeEliminar ? handleEliminar : undefined}
            />
          )}
        </div>
      </main>
    </RequirePermiso>
  );
}

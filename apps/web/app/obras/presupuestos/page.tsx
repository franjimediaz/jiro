"use client";

import { useEffect, useMemo, useState } from "react";
import { TablaListado } from "@repo/ui";
import styles from "./Presupuestos.module.css";
import { useRouter } from "next/navigation";
import { RequirePermiso, usePermisos } from "../../lib/permisos";

type Presupuesto = {
  id: number;
  nombre: string;
  aceptado: boolean;
  importe: number;
  // campos adicionales si los tienes: createdAt, obraId, clienteId, etc.
};

type Columna = {
  clave: string;
  encabezado: string;
  tipo?: "texto" | "checkbox";
  render?: (valor: any, fila: any) => React.ReactNode;
};

export default function PresupuestosPage() {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { can } = usePermisos();

  const puedeEditar = can("presupuestos", "editar");
  const puedeEliminar = can("presupuestos", "eliminar");

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/presupuestos`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        if (res.status === 401) {
          // no autenticado
          if (typeof window !== "undefined") window.location.href = "/login";
          return;
        }
        // Si fuese 403 aquí (no debería si solo pedimos permisos en /me/permissions),
        // dejamos que <RequirePermiso/> gestione la redirección.

        const data = await res.json();
        setPresupuestos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error al obtener presupuestos:", err);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, []);

  const handleEliminar = (presupuesto: Presupuesto) => {
    if (!puedeEliminar) return;
    if (confirm(`¿Eliminar presupuesto "${presupuesto.nombre}"?`)) {
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/presupuestos/${presupuesto.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      )
        .then((res) => {
          if (res.status === 401) {
            if (typeof window !== "undefined") window.location.href = "/login";
            return;
          }
          if (res.status === 403) {
            router.replace("/403");
            return;
          }
          if (!res.ok) throw new Error("Error en el borrado");
          setPresupuestos((prev) =>
            prev.filter((o) => o.id !== presupuesto.id)
          );
          alert("Presupuesto eliminado");
        })
        .catch(() => alert("Error al eliminar"));
    }
  };

  const columnas: Columna[] = useMemo(
    () => [
      { clave: "nombre", encabezado: "Nombre", tipo: "texto" },
      { clave: "aceptado", encabezado: "Aceptado", tipo: "checkbox" },
      {
        clave: "importe",
        encabezado: "Importe",
        tipo: "texto",
        render: (valor: number) =>
          typeof valor === "number" ? `${valor.toFixed(2)} €` : "0,00 €",
      },
    ],
    []
  );

  return (
    <RequirePermiso modulo="presupuestos" accion="ver">
      <main>
        <div className={styles.PresupuestosContainer}>
          <div className={styles.header}>
            <h1>Listado de Presupuestos</h1>
            {/* Si más adelante tienes una ruta de creación global, puedes habilitar un botón aquí
            {can("presupuestos", "crear") && (
              <button
                className={styles.botonCrear}
                onClick={() => router.push("/presupuestos/create")}
              >
                + Crear Presupuesto
              </button>
            )} */}
          </div>

          {loading ? (
            <p>Cargando Presupuestos...</p>
          ) : (
            <TablaListado
              titulo=""
              columnas={columnas}
              datos={presupuestos}
              onVer={(p) => router.push(`/obras/presupuestos/${p.id}`)}
              onEditar={
                puedeEditar
                  ? (p) => router.push(`/obras/presupuestos/${p.id}?edit=true`)
                  : undefined
              }
              onEliminar={puedeEliminar ? handleEliminar : undefined}
              mostrarImportar={false}
            />
          )}
        </div>
      </main>
    </RequirePermiso>
  );
}

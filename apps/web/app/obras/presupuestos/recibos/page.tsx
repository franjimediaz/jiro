"use client";

import { useEffect, useState } from "react";
import { TablaListado } from "@repo/ui";
import styles from "./Recibos.module.css";
import { useRouter } from "next/navigation";
import { Columna } from "@repo/shared/types";
import { RequirePermiso, usePermisos } from "../../../lib/permisos";

type Recibo = {
  id: number;
  referencia?: string;
  fecha?: string; // ISO
  estado?: string; // "pendiente" | "pagado" | "cancelado" | ...
  // Campos opcionales por compatibilidad si tu API los devuelve:
  nombre?: string;
  direccion?: string;
};

export default function RecibosPage() {
  const router = useRouter();
  const { can } = usePermisos();
  const puedeCrear = can("recibos", "crear");
  const puedeEditar = can("recibos", "editar");
  const puedeEliminar = can("recibos", "eliminar");

  const [recibos, setRecibos] = useState<Recibo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recibos`, {
          credentials: "include",
        });

        if (res.status === 401) {
          if (typeof window !== "undefined") window.location.href = "/login";
          return;
        }
        if (res.status === 403) {
          router.replace("/403");
          return;
        }

        const data = await res.json();

        if (Array.isArray(data)) {
          setRecibos(data);
        } else if (Array.isArray(data?.recibos)) {
          setRecibos(data.recibos);
        } else {
          console.warn("La respuesta de /recibos no es un array:", data);
          setRecibos([]);
        }
      } catch (err) {
        console.error("Error al obtener Recibos:", err);
        setRecibos([]);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [router]);

  const handleEliminar = async (recibo: Recibo) => {
    if (!puedeEliminar) return;
    if (!confirm(`¿Eliminar recibo "${recibo.referencia ?? recibo.id}"?`))
      return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recibos/${recibo.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (res.status === 401) {
        if (typeof window !== "undefined") window.location.href = "/login";
        return;
      }
      if (res.status === 403) {
        router.replace("/403");
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`Error al eliminar: ${err?.error || "Error desconocido"}`);
        return;
      }

      setRecibos((prev) => prev.filter((o) => o.id !== recibo.id));
      alert("Recibo eliminado");
    } catch (e) {
      console.error(e);
      alert("Error al eliminar");
    }
  };

  const columnas: Columna[] = [
    { clave: "referencia", encabezado: "Referencia" },
    {
      clave: "fecha",
      encabezado: "Fecha",
      render: (valor: string) =>
        valor ? new Date(valor).toLocaleDateString("es-ES") : "",
    },
    {
      clave: "estado",
      encabezado: "Estado",
      tipo: "texto",
      render: (valor: string) => (
        <span
          style={{
            padding: "0.25rem 0.5rem",
            borderRadius: "4px",
            fontSize: "0.8rem",
            fontWeight: "bold",
            backgroundColor:
              valor === "pagado"
                ? "#d1fae5"
                : valor === "cancelado"
                  ? "#fee2e2"
                  : "#fef3c7",
            color:
              valor === "pagado"
                ? "#065f46"
                : valor === "cancelado"
                  ? "#7f1d1d"
                  : "#92400e",
          }}
        >
          {valor || "pendiente"}
        </span>
      ),
    },
  ];

  return (
    <RequirePermiso modulo="recibos" accion="ver">
      <main>
        <div className={styles.RecibosContainer}>
          <div className={styles.header}>
            <h1>Listado de Recibos</h1>

            {puedeCrear && (
              <button
                className={styles.botonCrear}
                onClick={() =>
                  router.push("/obras/presupuestos/recibos/create")
                }
              >
                + Crear Recibo
              </button>
            )}
          </div>

          {loading ? (
            <p>Cargando Recibos...</p>
          ) : (
            <TablaListado
              titulo=""
              columnas={columnas}
              datos={recibos}
              onVer={(r) => router.push(`/obras/presupuestos/recibos/${r.id}`)}
              onEditar={
                puedeEditar
                  ? (r) =>
                      router.push(
                        `/obras/presupuestos/recibos/${r.id}?edit=true`
                      )
                  : undefined
              }
              onEliminar={puedeEliminar ? (r) => handleEliminar(r) : undefined}
              mostrarImportar={false}
            />
          )}
        </div>
      </main>
    </RequirePermiso>
  );
}

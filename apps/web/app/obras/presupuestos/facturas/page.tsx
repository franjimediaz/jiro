"use client";

import { useEffect, useMemo, useState } from "react";
import TablaListado from "../../../components/TablaListado";
import styles from "./Facturas.module.css";
import type { Columna } from "../../../components/TablaListado";
import { useRouter } from "next/navigation";
import { RequirePermiso, usePermisos } from "../../../lib/permisos";

type Factura = {
  id: number;
  referencia?: string | null;
  numero?: string | null;
  descripcion?: string | null;
  fecha?: string | null; // en backend existe 'fecha'
  createdAt?: string | null; // algunas vistas usan createdAt
  estado?: string | null; // "pendiente" | "pagado" | "cancelado"
  cantidad?: number | null; // en tu backend usas 'cantidad' como importe de la factura
  importe?: number | null; // por si viene 'importe'
};

export default function FacturasPage() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const { can } = usePermisos();
  const puedeVer = can("facturas", "ver");
  const puedeEditar = can("facturas", "editar");
  const puedeEliminar = can("facturas", "eliminar");

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/facturas`, {
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
        setFacturas(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error al obtener facturas:", err);
        setFacturas([]);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [router]);

  const handleEliminar = async (factura: Factura) => {
    if (!puedeEliminar) return;

    const etiqueta =
      factura.referencia ?? factura.numero ?? factura.descripcion ?? factura.id;

    if (!confirm(`¿Eliminar factura "${etiqueta}"?`)) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/facturas/${factura.id}`,
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
      if (!res.ok) throw new Error("Error al eliminar");

      setFacturas((prev) => prev.filter((o) => o.id !== factura.id));
      alert("Factura eliminada");
    } catch (err) {
      console.error("Error al eliminar:", err);
      alert("Error al eliminar");
    }
  };

  const columnas: Columna[] = useMemo(
    () => [
      { clave: "referencia", encabezado: "Referencia" },
      {
        clave: "fecha",
        encabezado: "Fecha",
        tipo: "texto",
        render: (_: any, fila: Factura) => {
          const f = fila.fecha ?? fila.createdAt;
          if (!f) return "-";
          return new Date(f).toLocaleDateString("es-ES");
        },
      },
      {
        clave: "cantidad",
        encabezado: "Importe",
        tipo: "texto",
        render: (_: any, fila: Factura) => {
          const val =
            typeof fila.cantidad === "number"
              ? fila.cantidad
              : typeof fila.importe === "number"
                ? fila.importe
                : 0;
          return `${val.toFixed(2)} €`;
        },
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
              backgroundColor: valor === "pagado" ? "#d1fae5" : "#fef3c7",
              color: valor === "pagado" ? "#065f46" : "#92400e",
            }}
          >
            {valor || "pendiente"}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <RequirePermiso modulo="facturas" accion="ver">
      <main>
        <div className={styles.FacturasContainer}>
          <div className={styles.header}>
            <h1>Listado de Facturas</h1>
          </div>

          {loading ? (
            <p>Cargando Facturas...</p>
          ) : (
            <TablaListado
              titulo=""
              columnas={columnas}
              datos={facturas}
              onVer={
                puedeVer
                  ? (f) => router.push(`/obras/presupuestos/facturas/${f.id}`)
                  : undefined
              }
              onEditar={
                puedeEditar
                  ? (f) =>
                      router.push(
                        `/obras/presupuestos/facturas/${f.id}?edit=true`
                      )
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

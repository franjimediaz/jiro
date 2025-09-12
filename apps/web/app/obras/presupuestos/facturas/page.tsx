"use client";

import { useEffect, useState } from "react";
import TablaListado from "../../../components/TablaListado";
import styles from "./Facturas.module.css";
import type { Columna } from "../../../components/TablaListado";
import { useRouter } from "next/navigation";

type Factura = {
  id: number;
  nombre: string;
  direccion: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
};

export default function FacturasPage() {
  const [Facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // ← Aquí

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/facturas`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setFacturas(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener Facturas:", err);
        setLoading(false);
      });
  }, []);

  const handleEliminar = (Factura: any) => {
    if (confirm(`¿Eliminar Factura "${Factura.nombre}"?`)) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/Facturas/${Factura.id}`, {
        method: "DELETE",
        credentials: "include",
      })
        .then(() => {
          setFacturas((prev) => prev.filter((o) => o.id !== Factura.id));
          alert("Factura eliminada");
        })
        .catch(() => alert("Error al eliminar"));
    }
  };

  const columnas: Columna[] = [
    { clave: "referencia", encabezado: "Referencia" },
    { clave: "fecha", encabezado: "Fecha" },
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
  ];

  return (
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
            datos={Facturas}
            onVer={(Facturas) =>
              router.push(`/obras/presupuestos/facturas/${Facturas.id}`)
            }
            onEditar={(Facturas) =>
              router.push(
                `/obras/presupuestos/facturas/${Facturas.id}?edit=true`
              )
            }
            onEliminar={handleEliminar}
            mostrarImportar={false}
          />
        )}
      </div>
    </main>
  );
}

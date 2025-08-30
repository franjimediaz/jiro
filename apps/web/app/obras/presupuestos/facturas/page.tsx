"use client";

import { useEffect, useState } from "react";
import TablaListado from "../../../components/TablaListado";
import styles from "./Facturas.module.css"; // o donde tengas el CSS
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
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/facturas`)
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
      })
        .then(() => {
          setFacturas((prev) => prev.filter((o) => o.id !== Factura.id));
          alert("Factura eliminada");
        })
        .catch(() => alert("Error al eliminar"));
    }
  };

  const columnas = [
    { clave: "referencia", encabezado: "Referencia" },
    { clave: "fecha", encabezado: "Fecha" },
    { clave: "cobrada", encabezado: "Cobrada" },
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
            onVer={(Facturas) => router.push(`/Facturas/${Facturas.id}`)}
            onEditar={(Facturas) =>
              router.push(`/Facturas/${Facturas.id}?edit=true`)
            }
            onEliminar={handleEliminar}
            mostrarImportar={false}
          />
        )}
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import TablaListado from "../../components/TablaListado";
import styles from "./Presupuestos.module.css";
import { useRouter } from "next/navigation";

type Presupuesto = {
  id: number;
  nombre: string;
  direccion: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  aceptado: boolean;
  importe: number;
};
type Columna = {
  clave: string;
  encabezado: string;
  tipo?: "texto" | "checkbox";
  render?: (valor: any, fila: any) => React.ReactNode;
};

export default function PresupuestosPage() {
  const [Presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // ← Aquí

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/Presupuestos`)
      .then((res) => res.json())
      .then((data) => {
        setPresupuestos(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener Presupuestos:", err);
        setLoading(false);
      });
  }, []);

  const handleEliminar = (Presupuesto: any) => {
    if (confirm(`¿Eliminar Presupuesto "${Presupuesto.nombre}"?`)) {
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/Presupuestos/${Presupuesto.id}`,
        {
          method: "DELETE",
        }
      )
        .then(() => {
          setPresupuestos((prev) =>
            prev.filter((o) => o.id !== Presupuesto.id)
          );
          alert("Presupuesto eliminada");
        })
        .catch(() => alert("Error al eliminar"));
    }
  };

  const columnas: Columna[] = [
    { clave: "nombre", encabezado: "Nombre", tipo: "texto" },
    { clave: "aceptado", encabezado: "Aceptado", tipo: "checkbox" },
    { clave: "importe", encabezado: "Importe", tipo: "texto" },
  ];

  return (
    <main>
      <div className={styles.PresupuestosContainer}>
        <div className={styles.header}>
          <h1>Listado de Presupuestos</h1>
        </div>

        {loading ? (
          <p>Cargando Presupuestos...</p>
        ) : (
          <TablaListado
            titulo=""
            columnas={columnas}
            datos={Presupuestos}
            onVer={(Presupuestos) =>
              router.push(`presupuestos/${Presupuestos.id}`)
            }
            onEditar={(Presupuestos) =>
              router.push(`presupuestos/${Presupuestos.id}?edit=true`)
            }
            onEliminar={handleEliminar}
            mostrarImportar={false}
          />
        )}
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import TablaListado from "../../../components/TablaListado";
import styles from "./Recibos.module.css"; // o donde tengas el CSS
import { useRouter } from "next/navigation";

type Recibo = {
  id: number;
  nombre: string;
  direccion: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
};

export default function RecibosPage() {
  const [Recibos, setRecibos] = useState<Recibo[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // ← Aquí

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/Recibos`)
      .then((res) => res.json())
      .then((data) => {
        setRecibos(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener Recibos:", err);
        setLoading(false);
      });
  }, []);

  const handleEliminar = (Recibo: any) => {
    if (confirm(`¿Eliminar Recibo "${Recibo.nombre}"?`)) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/Recibos/${Recibo.id}`, {
        method: "DELETE",
      })
        .then(() => {
          setRecibos((prev) => prev.filter((o) => o.id !== Recibo.id));
          alert("Recibo eliminada");
        })
        .catch(() => alert("Error al eliminar"));
    }
  };

  const columnas = [
    { clave: "nombre", encabezado: "Nombre" },
    { clave: "direccion", encabezado: "Dirección" },
  ];

  return (
    <main>
      <div className={styles.RecibosContainer}>
        <div className={styles.header}>
          <h1>Listado de Recibos</h1>
          <button
            className={styles.botonCrear}
            onClick={() => router.push("/Recibos/create")}
          >
            + Crear Recibo
          </button>
        </div>

        {loading ? (
          <p>Cargando Recibos...</p>
        ) : (
          <TablaListado
            titulo=""
            columnas={columnas}
            datos={Recibos}
            onVer={(Recibos) => router.push(`/Recibos/${Recibos.id}`)}
            onEditar={(Recibos) =>
              router.push(`/Recibos/${Recibos.id}?edit=true`)
            }
            onEliminar={handleEliminar}
          />
        )}
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import TablaListado from "../../components/TablaListado";
import styles from "./Estados.module.css"; // o donde tengas el CSS
import { useRouter } from "next/navigation";

type Estado = {
  id: number;
  nombre: string;
  direccion: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
};

export default function EstadosPage() {
  const [Estados, setEstados] = useState<Estado[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // ← Aquí

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/estados`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setEstados(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener Estados:", err);
        setLoading(false);
      });
  }, []);

  const handleEliminar = (Estado: any) => {
    if (confirm(`¿Eliminar Estado "${Estado.nombre}"?`)) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/estados/${Estado.id}`, {
        method: "DELETE",
        credentials: "include",
      })
        .then(() => {
          setEstados((prev) => prev.filter((o) => o.id !== Estado.id));
          alert("Estado eliminada");
        })
        .catch(() => alert("Error al eliminar"));
    }
  };

  const columnas = [
    { clave: "nombre", encabezado: "Nombre" },
    { clave: "color", encabezado: "Color" },
    { clave: "icono", encabezado: "Icono" },
  ];

  return (
    <main>
      <div className={styles.EstadosContainer}>
        <div className={styles.header}>
          <h1>Listado de Estados</h1>
          <button
            className={styles.botonCrear}
            onClick={() => router.push("estados/create")}
          >
            + Crear Estado
          </button>
        </div>

        {loading ? (
          <p>Cargando Estados...</p>
        ) : (
          <TablaListado
            titulo=""
            columnas={columnas}
            datos={Estados}
            onVer={(Estados) => router.push(`/system/estados/${Estados.id}`)}
            onEditar={(Estados) =>
              router.push(`/system/estados/${Estados.id}?edit=true`)
            }
            onEliminar={handleEliminar}
          />
        )}
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import TablaListado from "../components/TablaListado";
import styles from "./Obras.module.css"; // o donde tengas el CSS
import { useRouter } from "next/navigation";

type Obra = {
  id: number;
  nombre: string;
  direccion: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
};

export default function ObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // ← Aquí

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/obras`)
      .then((res) => res.json())
      .then((data) => {
        setObras(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener obras:", err);
        setLoading(false);
      });
  }, []);

  const handleEliminar = (obra: any) => {
    if (confirm(`¿Eliminar obra "${obra.nombre}"?`)) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/obras/${obra.id}`, {
        method: "DELETE",
      })
        .then(() => {
          setObras((prev) => prev.filter((o) => o.id !== obra.id));
          alert("Obra eliminada");
        })
        .catch(() => alert("Error al eliminar"));
    }
  };

  const columnas = [
    { clave: "nombre", encabezado: "Nombre" },
    { clave: "direccion", encabezado: "Dirección" },
    {
      clave: "fechaInicio",
      encabezado: "Inicio",
      render: (valor: string) => new Date(valor).toLocaleDateString(),
    },
    {
      clave: "fechaFin",
      encabezado: "Fin",
      render: (valor: string) => new Date(valor).toLocaleDateString(),
    },
  ];
  const exportC = [
    { clave: "id", encabezado: "ID" },
    { clave: "nombre", encabezado: "Nombre" },
    { clave: "estadoId", encabezado: "Estado" },
    { clave: "clienteId", encabezado: "Cliente" },
    { clave: "direccion", encabezado: "Dirección" },
    {
      clave: "fechaInicio",
      encabezado: "Inicio",
    },
    {
      clave: "fechaFin",
      encabezado: "Fin",
    },
  ];

  return (
    <main>
      <div className={styles.obrasContainer}>
        <div className={styles.header}>
          <h1>Listado de Obras</h1>
          <button
            className={styles.botonCrear}
            onClick={() => router.push("/obras/create")}
          >
            + Crear Obra
          </button>
        </div>

        {loading ? (
          <p>Cargando obras...</p>
        ) : (
          <TablaListado
            titulo=""
            columnas={columnas}
            datos={obras}
            onVer={(obras) => router.push(`/obras/${obras.id}`)}
            onEditar={(obras) => router.push(`/obras/${obras.id}?edit=true`)}
            onEliminar={handleEliminar}
            registrosPorPagina={10}
            exportC={exportC}
            mostrarImportar={true}
            importUrl={`${process.env.NEXT_PUBLIC_API_URL}/obras`}
            onImport={async () => {
              const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/obras`
              );
              const nuevosDatos = await res.json();
              setObras(nuevosDatos);
            }}
          />
        )}
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import TablaListado from "../components/TablaListado";
import styles from "./Materiales.module.css"; // o donde tengas el CSS
import { useRouter } from "next/navigation";

type material = {
  id: number;
  nombre: string;
  direccion: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
};

export default function materialesPage() {
  const [materiales, setmateriales] = useState<material[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // ← Aquí

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/materiales`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setmateriales(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener materiales:", err);
        setLoading(false);
      });
  }, []);

  const handleEliminar = (material: any) => {
    if (confirm(`¿Eliminar material "${material.nombre}"?`)) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/materiales/${material.id}`, {
        method: "DELETE",
        credentials: "include",
      })
        .then(() => {
          setmateriales((prev) => prev.filter((o) => o.id !== material.id));
          alert("material eliminada");
        })
        .catch(() => alert("Error al eliminar"));
    }
  };

  const columnas = [
    { clave: "nombre", encabezado: "Nombre" },
    { clave: "stockActual", encabezado: "Stock" },
    { clave: "precio", encabezado: "Precio" },
  ];
  const exportC = [
    { clave: "id", encabezado: "Id" },
    { clave: "nombre", encabezado: "Nombre" },
    { clave: "descripcion", encabezado: "Descripción" },
    { clave: "proveedor", encabezado: "Proveedor" },
    { clave: "stockActual", encabezado: "Stock" },
    { clave: "precio", encabezado: "Precio" },
    { clave: "unidadMedida", encabezado: "Unidad de medida" },
  ];

  return (
    <main>
      <div className={styles.materialesContainer}>
        <div className={styles.header}>
          <h1>Listado de materiales</h1>
          <button
            className={styles.botonCrear}
            onClick={() => router.push("/materiales/create")}
          >
            + Crear material
          </button>
        </div>

        {loading ? (
          <p>Cargando materiales...</p>
        ) : (
          <TablaListado
            titulo=""
            columnas={columnas}
            datos={materiales}
            onVer={(materiales) => router.push(`/materiales/${materiales.id}`)}
            onEditar={(materiales) =>
              router.push(`/materiales/${materiales.id}?edit=true`)
            }
            onEliminar={handleEliminar}
            exportC={exportC}
            mostrarImportar={true}
            registrosPorPagina={15}
            importUrl={`${process.env.NEXT_PUBLIC_API_URL}/materiales`}
            onImport={async () => {
              const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/materiales`,
                {
                  credentials: "include",
                }
              );
              const nuevosDatos = await res.json();
              setmateriales(nuevosDatos);
            }}
          />
        )}
      </div>
    </main>
  );
}

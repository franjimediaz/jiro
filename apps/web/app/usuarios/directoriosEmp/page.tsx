"use client";

import { useEffect, useState } from "react";
import TablaListado from "../../components/TablaListado";
import styles from "./Directorio.module.css"; // o donde tengas el CSS
import { useRouter } from "next/navigation";

type Directorio = {
  id: number;
  nombre: string;
  direccion: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
};

export default function DirectoriosPage() {
  const [Directorios, setDirectorios] = useState<Directorio[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // ← Aquí

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/Directorios`)
      .then((res) => res.json())
      .then((data) => {
        setDirectorios(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener Directorios:", err);
        setLoading(false);
      });
  }, []);

  const handleEliminar = (Directorio: any) => {
    if (confirm(`¿Eliminar Directorio "${Directorio.nombre}"?`)) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/Directorios/${Directorio.id}`, {
        method: "DELETE",
      })
        .then(() => {
          setDirectorios((prev) => prev.filter((o) => o.id !== Directorio.id));
          alert("Directorio eliminada");
        })
        .catch(() => alert("Error al eliminar"));
    }
  };

  const columnas = [
    { clave: "nombre", encabezado: "Nombre" },
    { clave: "apellido", encabezado: "Apellido" },
    { clave: "idDirectorio", encabezado: "ID Directorio" },
    { clave: "activo", encabezado: "Activo" },
  ];
  const exportC = [
    { clave: "id", encabezado: "ID" },
    { clave: "nombre", encabezado: "Nombre" },
    { clave: "apellido", encabezado: "Apellido" },
    { clave: "idDirectorio", encabezado: "ID Directorio" },
    { clave: "email", encabezado: "Email" },
    { clave: "telefono", encabezado: "Teléfono" },
    { clave: "rol", encabezado: "Rol" },
    { clave: "activo", encabezado: "Activo" },
  ];

  return (
    <main>
      <div className={styles.DirectoriosContainer}>
        <div className={styles.header}>
          <h1>Directorios Empresas</h1>
          <button
            className={styles.botonCrear}
            onClick={() => router.push("directorios/create")}
          >
            + Crear Directorio
          </button>
        </div>

        {loading ? (
          <p>Cargando Directorios...</p>
        ) : (
          <TablaListado
            titulo=""
            columnas={columnas}
            datos={Directorios}
            onVer={(Directorios) =>
              router.push(`/Directorios/${Directorios.id}`)
            }
            onEditar={(Directorios) =>
              router.push(`/Directorios/${Directorios.id}?edit=true`)
            }
            onEliminar={handleEliminar}
            registrosPorPagina={10}
            exportC={exportC}
            mostrarImportar={true}
            importUrl={`${process.env.NEXT_PUBLIC_API_URL}/Directorios`}
            onImport={async () => {
              const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/Directorios`
              );
              const nuevosDatos = await res.json();
              setDirectorios(nuevosDatos);
            }}
          />
        )}
      </div>
    </main>
  );
}

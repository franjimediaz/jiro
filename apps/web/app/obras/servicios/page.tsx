"use client";

import { useEffect, useState } from "react";
import TablaListado from "../../components/TablaListado";
import styles from "./Servicios.module.css"; // o donde tengas el CSS
import { useRouter } from "next/navigation";

type Servicio = {
  id: number;
  nombre: string;
  direccion: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
};

export default function ServiciosPage() {
  const [Servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // ← Aquí

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/servicios`)
      .then((res) => res.json())
      .then((data) => {
        setServicios(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener Servicios:", err);
        setLoading(false);
      });
  }, []);

  const handleEliminar = (Servicio: any) => {
    if (confirm(`¿Eliminar Servicio "${Servicio.nombre}"?`)) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/servicios/${Servicio.id}`, {
        method: "DELETE",
      })
        .then(() => {
          setServicios((prev) => prev.filter((o) => o.id !== Servicio.id));
          alert("Servicio eliminada");
        })
        .catch(() => alert("Error al eliminar"));
    }
  };

  const columnas = [
    { clave: "nombre", encabezado: "Nombre" },
    { clave: "color", encabezado: "Color" },
    { clave: "icono", encabezado: "Icono" },
  ];
  const exportC = [
    { clave: "id", encabezado: "Id" },
    { clave: "nombre", encabezado: "Nombre" },
    { clave: "color", encabezado: "Color" },
    { clave: "icono", encabezado: "Icono" },
  ];

  return (
    <main>
      <div className={styles.ServiciosContainer}>
        <div className={styles.header}>
          <h1>Listado de Servicios</h1>
          <button
            className={styles.botonCrear}
            onClick={() => router.push("/obras/servicios/create")}
          >
            + Crear Servicio
          </button>
        </div>

        {loading ? (
          <p>Cargando Servicios...</p>
        ) : (
          <TablaListado
            titulo=""
            columnas={columnas}
            datos={Servicios}
            onVer={(Servicios) =>
              router.push(`/obras/servicios/${Servicios.id}`)
            }
            onEditar={(Servicios) =>
              router.push(`/obras/servicios/${Servicios.id}?edit=true`)
            }
            onEliminar={handleEliminar}
            registrosPorPagina={10}
            exportC={exportC}
            mostrarImportar={true}
            importUrl={`${process.env.NEXT_PUBLIC_API_URL}/servicios`}
            onImport={async () => {
              const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/servicios`
              );
              const nuevosDatos = await res.json();
              setServicios(nuevosDatos);
            }}
          />
        )}
      </div>
    </main>
  );
}

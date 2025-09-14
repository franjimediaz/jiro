"use client";

import { useEffect, useState } from "react";
import TablaListado from "../../components/TablaListado";
import styles from "./Directorio.module.css";
import { useRouter } from "next/navigation";
import { RequirePermiso, usePermisos } from "../../lib/permisos";

type Directorio = {
  id: number;
  nombre: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  estado?: boolean; // activo/inactivo
};

export default function DirectoriosPage() {
  const [directorios, setDirectorios] = useState<Directorio[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const { loading: loadingPerms, can } = usePermisos();
  const puedeCrear = can("directorios", "crear");
  const puedeEliminar = can("directorios", "eliminar");

  useEffect(() => {
    // Espera a tener permisos resueltos y sólo entonces pide datos
    if (loadingPerms) return;
    if (!can("directorios", "ver")) return;

    const cargar = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/directorios`,
          {
            credentials: "include",
          }
        );

        if (res.status === 401) {
          if (typeof window !== "undefined") window.location.href = "/login";
          return;
        }
        // Si devolviera 403 aquí, RequirePermiso se encarga de redirigir la vista

        const data = await res.json();
        setDirectorios(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error al obtener directorios:", err);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [loadingPerms, can]);

  const handleEliminar = (registro: Directorio) => {
    if (!puedeEliminar) {
      alert("No tienes permisos para eliminar directorios.");
      return;
    }
    if (confirm(`¿Eliminar directorio "${registro.nombre}"?`)) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/directorios/${registro.id}`, {
        method: "DELETE",
        credentials: "include",
      })
        .then((res) => {
          if (!res.ok) throw new Error("Error al eliminar");
          setDirectorios((prev) => prev.filter((o) => o.id !== registro.id));
          alert("Directorio eliminado");
        })
        .catch(() => alert("Error al eliminar"));
    }
  };

  const columnas = [
    { clave: "nombre", encabezado: "Nombre" },
    { clave: "apellidos", encabezado: "Apellidos" },
    { clave: "email", encabezado: "Email" },
    {
      clave: "estado",
      encabezado: "Activo",
      tipo: "checkbox" as const,
      render: (valor: boolean) => (valor ? "Sí" : "No"),
    },
  ];

  const exportC = [
    { clave: "id", encabezado: "ID" },
    { clave: "nombre", encabezado: "Nombre" },
    { clave: "apellidos", encabezado: "Apellidos" },
    { clave: "dni", encabezado: "DNI" },
    { clave: "email", encabezado: "Email" },
    { clave: "telefono", encabezado: "Teléfono" },
    { clave: "puesto", encabezado: "Puesto" },
    { clave: "estado", encabezado: "Activo" },
  ];

  return (
    <RequirePermiso modulo="directorios" accion="ver" fallback={null}>
      <main>
        <div className={styles.DirectoriosContainer}>
          <div className={styles.header}>
            <h1>Listado de Directorios</h1>
            {/** 
            {puedeCrear && (
              <button
                className={styles.botonCrear}
                onClick={() => router.push("/usuarios/directorios/create")}
              >
                + Crear Directorio
              </button>
            )}
              */}
          </div>

          {loading ? (
            <p>Cargando directorios...</p>
          ) : (
            <TablaListado
              titulo=""
              columnas={columnas}
              datos={directorios}
              onVer={(fila) => router.push(`/usuarios/directorios/${fila.id}`)}
              onEditar={(fila) =>
                router.push(`/usuarios/directorios/${fila.id}?edit=true`)
              }
              onEliminar={puedeEliminar ? handleEliminar : undefined}
              registrosPorPagina={10}
              exportC={exportC}
              mostrarImportar={false}
              onImport={undefined}
            />
          )}
        </div>
      </main>
    </RequirePermiso>
  );
}

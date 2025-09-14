"use client";

import { useEffect, useState } from "react";
import TablaListado from "../../components/TablaListado";
import styles from "./Directorio.module.css";
import { useRouter } from "next/navigation";
import { RequirePermiso } from "../../lib/permisos";

type Directorio = {
  id: string; // cuid() en tu esquema
  nombre: string;
  apellidos?: string | null;
  email: string;
  telefono?: string | null;
  puesto?: string | null;
  estado?: boolean | null; // en tu modelo se llama "estado" (boolean)
};

export default function DirectoriosPage() {
  const [directorios, setDirectorios] = useState<Directorio[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Carga inicial
  useEffect(() => {
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
        if (res.status === 403) {
          router.replace("/403");
          return;
        }

        const data = await res.json();
        if (Array.isArray(data)) setDirectorios(data);
        else if (Array.isArray(data?.directorios))
          setDirectorios(data.directorios);
        else setDirectorios([]);
      } catch (err) {
        console.error("Error al obtener Directorios:", err);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [router]);

  const recargar = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/directorios`,
        {
          credentials: "include",
        }
      );
      if (!res.ok) return;
      const data = await res.json();
      setDirectorios(Array.isArray(data) ? data : (data?.directorios ?? []));
    } catch {}
  };

  const handleEliminar = async (dir: Directorio) => {
    if (!confirm(`¿Eliminar directorio de "${dir.nombre}"?`)) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/directorios/${dir.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (res.status === 401) {
        if (typeof window !== "undefined") window.location.href = "/login";
        return;
      }
      if (res.status === 403) {
        router.replace("/403");
        return;
      }

      if (res.ok) {
        setDirectorios((prev) => prev.filter((d) => d.id !== dir.id));
        alert("Directorio eliminado");
      } else {
        const data = await res.json().catch(() => ({}));
        alert(
          "Error al eliminar: " +
            (data?.error || data?.message || "desconocido")
        );
      }
    } catch (e) {
      console.error(e);
      alert("Error al eliminar");
    }
  };

  const columnas = [
    { clave: "nombre", encabezado: "Nombre" },
    { clave: "apellidos", encabezado: "Apellidos" },
    { clave: "email", encabezado: "Email" },
    { clave: "telefono", encabezado: "Teléfono" },
    { clave: "puesto", encabezado: "Puesto" },
    { clave: "estado", encabezado: "Activo" },
  ];

  const exportC = [
    { clave: "id", encabezado: "ID" },
    { clave: "nombre", encabezado: "Nombre" },
    { clave: "apellidos", encabezado: "Apellidos" },
    { clave: "dni", encabezado: "DNI" },
    { clave: "email", encabezado: "Email" },
    { clave: "emailPersonal", encabezado: "Email personal" },
    { clave: "telefono", encabezado: "Teléfono" },
    { clave: "telefono2", encabezado: "Teléfono 2" },
    { clave: "puesto", encabezado: "Puesto" },
    { clave: "departamento", encabezado: "Departamento" },
    { clave: "empresaExterna", encabezado: "Empresa externa" },
    { clave: "jornada", encabezado: "Jornada" },
    { clave: "turno", encabezado: "Turno" },
    { clave: "estado", encabezado: "Activo" },
  ];

  return (
    <RequirePermiso modulo="directorios" accion="ver" fallback={<main />}>
      <main>
        <div className={styles.DirectoriosContainer}>
          <div className={styles.header}>
            <h1>Directorios de Empleados</h1>
            <RequirePermiso modulo="directorios" accion="crear">
              <button
                className={styles.botonCrear}
                onClick={() => router.push("/usuarios/directorios/create")}
              >
                + Crear Directorio
              </button>
            </RequirePermiso>
          </div>

          {loading ? (
            <p>Cargando Directorios...</p>
          ) : (
            <TablaListado
              titulo=""
              columnas={columnas}
              datos={directorios}
              onVer={(d: Directorio) =>
                router.push(`/usuarios/directorios/${d.id}`)
              }
              onEditar={(d: Directorio) =>
                router.push(`/usuarios/directorios/${d.id}?edit=true`)
              }
              onEliminar={handleEliminar}
              registrosPorPagina={10}
              exportC={exportC}
              mostrarImportar={true}
              importUrl={`${process.env.NEXT_PUBLIC_API_URL}/directorios`}
              onImport={async () => {
                await recargar();
              }}
            />
          )}
        </div>
      </main>
    </RequirePermiso>
  );
}

"use client";

import { useEffect, useState } from "react";
import TablaListado, { type Columna } from "../../components/TablaListado";
import styles from "./Servicios.module.css";
import { useRouter } from "next/navigation";
import { RequirePermiso, usePermisos } from "../../lib/permisos";

type Servicio = {
  id: number;
  nombre: string;
  color: string;
  icono: string;
};

export default function ServiciosPage() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { can } = usePermisos();

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/servicios`,
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
        setServicios(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error al obtener Servicios:", err);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [router]);

  const handleEliminar = async (servicio: Servicio) => {
    if (!can("servicios", "eliminar")) {
      router.replace("/403");
      return;
    }

    if (!confirm(`¿Eliminar servicio "${servicio.nombre}"?`)) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/servicios/${servicio.id}`,
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
        setServicios((prev) => prev.filter((o) => o.id !== servicio.id));
        alert("Servicio eliminado");
      } else {
        alert("Error al eliminar el servicio");
      }
    } catch (err) {
      console.error(err);
      alert("Error al eliminar");
    }
  };

  const columnas: Columna[] = [
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
    <RequirePermiso modulo="servicios" accion="ver">
      <main>
        <div className={styles.ServiciosContainer}>
          <div className={styles.header}>
            <h1>Listado de Servicios</h1>

            {can("servicios", "crear") && (
              <button
                className={styles.botonCrear}
                onClick={() => router.push("/obras/servicios/create")}
              >
                + Crear Servicio
              </button>
            )}
          </div>

          {loading ? (
            <p>Cargando Servicios...</p>
          ) : (
            <TablaListado
              titulo=""
              columnas={columnas}
              datos={servicios}
              onVer={(s) => router.push(`/obras/servicios/${s.id}`)}
              onEditar={
                can("servicios", "editar")
                  ? (s) => router.push(`/obras/servicios/${s.id}?edit=true`)
                  : undefined
              }
              onEliminar={
                can("servicios", "eliminar") ? handleEliminar : undefined
              }
              registrosPorPagina={10}
              exportC={exportC}
              mostrarImportar={true}
              importUrl={`${process.env.NEXT_PUBLIC_API_URL}/servicios`}
              onImport={async () => {
                try {
                  const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/servicios`,
                    { credentials: "include" }
                  );

                  if (res.status === 401) {
                    if (typeof window !== "undefined")
                      window.location.href = "/login";
                    return;
                  }
                  if (res.status === 403) {
                    router.replace("/403");
                    return;
                  }

                  const nuevosDatos = await res.json();
                  setServicios(Array.isArray(nuevosDatos) ? nuevosDatos : []);
                } catch (e) {
                  console.error(
                    "Error al refrescar servicios tras importar:",
                    e
                  );
                }
              }}
            />
          )}
        </div>
      </main>
    </RequirePermiso>
  );
}

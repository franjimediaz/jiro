"use client";

import { useEffect, useState } from "react";
import { TablaListado } from "@repo/ui";
import styles from "./Obras.module.css"; // o donde tengas el CSS
import { useRouter } from "next/navigation";
import { RequirePermiso, usePermisos } from "../lib/permisos";

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
  const router = useRouter();

  // ⬇️ Cargamos permisos desde el provider
  const { loading: permisosLoading, can } = usePermisos();

  // ⬇️ Traer datos SOLO si tiene permiso de 'ver'
  useEffect(() => {
    if (permisosLoading) return; // espera a que carguen permisos

    if (!can("obras", "ver")) {
      // si no puede ver, no pidas nada y marca como cargado
      setObras([]);
      setLoading(false);
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/obras`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setObras(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener obras:", err);
        setLoading(false);
      });
  }, [permisosLoading, can]);

  const handleEliminar = (obra: any) => {
    if (!can("obras", "eliminar")) {
      alert("Sin permiso para eliminar");
      return;
    }

    if (confirm(`¿Eliminar obra "${obra.nombre}"?`)) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/obras/${obra.id}`, {
        method: "DELETE",
        credentials: "include",
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

  // ⬇️ Si no hay permiso de exportar, pasamos un array vacío para no mostrar export (si tu tabla lo soporta así)
  const exportColumns = can("obras", "exportar") ? exportC : [];

  return (
    <RequirePermiso modulo="obras" accion="ver">
      <main>
        <div className={styles.obrasContainer}>
          <div className={styles.header}>
            <h1>Listado de Obras</h1>

            {/* Mostrar el botón crear solo si tiene permiso */}
            {can("obras", "crear") && (
              <button
                className={styles.botonCrear}
                onClick={() => router.push("/obras/create")}
              >
                + Crear Obra
              </button>
            )}
          </div>

          {loading ? (
            <p>Cargando obras...</p>
          ) : (
            <TablaListado
              titulo=""
              columnas={columnas}
              datos={obras}
              onVer={(obra) =>
                can("obras", "ver") && router.push(`/obras/${obra.id}`)
              }
              onEditar={(obra) =>
                can("obras", "editar") &&
                router.push(`/obras/${obra.id}?edit=true`)
              }
              onEliminar={handleEliminar}
              registrosPorPagina={10}
              exportC={exportColumns}
              mostrarImportar={can("obras", "importar")}
              importUrl={`${process.env.NEXT_PUBLIC_API_URL}/obras`}
              onImport={async () => {
                if (!can("obras", "importar")) return;
                const res = await fetch(
                  `${process.env.NEXT_PUBLIC_API_URL}/obras`,
                  {
                    credentials: "include",
                  }
                );
                const nuevosDatos = await res.json();
                setObras(nuevosDatos);
              }}
            />
          )}
        </div>
      </main>
    </RequirePermiso>
  );
}

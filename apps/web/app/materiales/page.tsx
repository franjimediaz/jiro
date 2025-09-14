"use client";

import { useEffect, useState } from "react";
import TablaListado from "../components/TablaListado";
import styles from "./Materiales.module.css";
import { useRouter } from "next/navigation";
import { RequirePermiso, usePermisos } from "../lib/permisos";

type Material = {
  id: number;
  nombre: string;
  descripcion?: string;
  proveedor?: string;
  stockActual?: number;
  precio?: number;
  unidadMedida?: string;
};

export default function MaterialesPage() {
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { can } = usePermisos();

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/materiales`,
          {
            credentials: "include",
          }
        );

        if (res.status === 401) {
          // No autenticado
          if (typeof window !== "undefined") window.location.href = "/login";
          return;
        }
        if (res.status === 403) {
          // Autenticado pero sin permiso
          router.replace("/403");
          return;
        }

        const data = await res.json();
        if (Array.isArray(data)) {
          setMateriales(data);
        } else if (Array.isArray((data as any)?.materiales)) {
          setMateriales((data as any).materiales);
        } else {
          console.error("❌ Respuesta inesperada al cargar materiales:", data);
          setMateriales([]);
        }
      } catch (err) {
        console.error("Error al obtener materiales:", err);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [router]);

  const handleEliminar = async (material: Material) => {
    if (!can("materiales", "eliminar")) return;
    if (!confirm(`¿Eliminar material "${material.nombre}"?`)) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/materiales/${material.id}`,
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

      if (!res.ok) throw new Error("Error al eliminar material");

      setMateriales((prev) => prev.filter((o) => o.id !== material.id));
      alert("Material eliminado");
    } catch (e) {
      console.error(e);
      alert("Error al eliminar");
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
    <RequirePermiso modulo="materiales" accion="ver">
      <main>
        <div className={styles.materialesContainer}>
          <div className={styles.header}>
            <h1>Listado de materiales</h1>
            {can("materiales", "crear") && (
              <button
                className={styles.botonCrear}
                onClick={() => router.push("/materiales/create")}
              >
                + Crear material
              </button>
            )}
          </div>

          {loading ? (
            <p>Cargando materiales...</p>
          ) : (
            <TablaListado
              titulo=""
              columnas={columnas}
              datos={materiales}
              onVer={(m: Material) => router.push(`/materiales/${m.id}`)}
              onEditar={
                can("materiales", "editar")
                  ? (m: Material) =>
                      router.push(`/materiales/${m.id}?edit=true`)
                  : undefined
              }
              onEliminar={
                can("materiales", "eliminar")
                  ? (m: Material) => handleEliminar(m)
                  : undefined
              }
              exportC={exportC}
              registrosPorPagina={15}
              mostrarImportar={can("materiales", "importar")}
              importUrl={`${process.env.NEXT_PUBLIC_API_URL}/materiales`}
              onImport={
                can("materiales", "importar")
                  ? async () => {
                      const res = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/materiales`,
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
                      setMateriales(
                        Array.isArray(nuevosDatos) ? nuevosDatos : []
                      );
                    }
                  : undefined
              }
            />
          )}
        </div>
      </main>
    </RequirePermiso>
  );
}

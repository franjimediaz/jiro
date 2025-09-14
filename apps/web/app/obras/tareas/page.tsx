"use client";

import { useEffect, useState } from "react";
import TablaListado from "../../components/TablaListado";
import styles from "./Tareas.module.css";
import { useRouter, useSearchParams } from "next/navigation";
import { RequirePermiso, usePermisos } from "../../lib/permisos";

type Tarea = {
  id: number;
  nombre: string;
  estado?: string;
  servicio?: string;
  direccion?: string;
};

type EstadoValido =
  | "pendiente"
  | "en curso"
  | "completado"
  | "cancelado"
  | "sin estado";

export default function TareasPage() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { can } = usePermisos();

  const puedeCrear = can("tareas", "crear");
  const puedeEditar = can("tareas", "editar");
  const puedeEliminar = can("tareas", "eliminar");

  // (Opcional) Si algún día usas filtros por obra/servicio:
  const obraId = searchParams.get("obraId");
  const servicioId = searchParams.get("servicioId");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/obras/tareas`,
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

        const data = await res.json().catch(() => []);
        if (Array.isArray(data)) {
          setTareas(data);
        } else if (Array.isArray(data?.tareas)) {
          setTareas(data.tareas);
        } else {
          console.error("❌ Los datos no son un array:", data);
          setTareas([]);
        }
      } catch (err) {
        console.error("Error al obtener tareas:", err);
        setTareas([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const handleEliminar = async (tarea: Tarea) => {
    if (!tarea?.id || isNaN(Number(tarea.id))) {
      alert("ID de tarea no válido");
      return;
    }

    if (!confirm(`¿Eliminar tarea "${tarea.nombre}"?`)) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/obras/tareas/${tarea.id}`,
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

      if (!res.ok) throw new Error("Error al eliminar tarea");

      setTareas((prev) => prev.filter((o) => o.id !== tarea.id));
      alert("Tarea eliminada");
    } catch (err) {
      console.error("❌ Error al eliminar tarea:", err);
      alert("Error al eliminar la tarea");
    }
  };

  const getEstadoFallback = (estado: string) => {
    const estadosConfig: Record<
      EstadoValido,
      { color: string; backgroundColor: string; icon: string }
    > = {
      pendiente: { color: "#f59e0b", backgroundColor: "#fef3c7", icon: "⏳" },
      "en curso": { color: "#3b82f6", backgroundColor: "#dbeafe", icon: "🔄" },
      completado: { color: "#10b981", backgroundColor: "#d1fae5", icon: "✅" },
      cancelado: { color: "#ef4444", backgroundColor: "#fee2e2", icon: "❌" },
      "sin estado": {
        color: "#6b7280",
        backgroundColor: "#f3f4f6",
        icon: "❓",
      },
    };

    const estadoKey = (estado?.toLowerCase() as EstadoValido) || "sin estado";
    return estadosConfig[estadoKey] || estadosConfig["sin estado"];
  };

  const columnas = [
    { clave: "nombre", encabezado: "Nombre" },
    {
      clave: "estado",
      encabezado: "Estado",
      render: (valor: string) => {
        const estilo = getEstadoFallback(valor);
        return (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.375rem 0.75rem",
              borderRadius: "6px",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: estilo.color,
              backgroundColor: estilo.backgroundColor,
              border: `1px solid ${estilo.color}20`,
            }}
          >
            <span style={{ fontSize: "1rem" }}>{estilo.icon}</span>
            <span>{valor || "Sin estado"}</span>
          </div>
        );
      },
    },
    { clave: "direccion", encabezado: "Dirección" },
  ];

  return (
    <RequirePermiso modulo="tareas" accion="ver">
      <main>
        <div className={styles.tareasContainer}>
          <div className={styles.header}>
            <h1>Listado de tareas</h1>

            {puedeCrear && (
              <button
                className={styles.botonCrear}
                onClick={() => router.push("/obras/tareas/create")}
              >
                + Crear Tarea
              </button>
            )}
          </div>

          {loading ? (
            <p>Cargando tareas...</p>
          ) : (
            <TablaListado
              titulo=""
              columnas={columnas}
              datos={tareas}
              onVer={(tarea: Tarea) => router.push(`/obras/tareas/${tarea.id}`)}
              onEditar={
                puedeEditar
                  ? (tarea: Tarea) =>
                      router.push(`/obras/tareas/${tarea.id}?edit=true`)
                  : undefined
              }
              onEliminar={puedeEliminar ? handleEliminar : undefined}
              mostrarImportar={false}
            />
          )}
        </div>
      </main>
    </RequirePermiso>
  );
}

"use client";

import { useEffect, useState } from "react";
import TablaListado from "../../components/TablaListado";
import styles from "./Tareas.module.css";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

type Tareas = {
  id: number;
  nombre: string;
  estado: string;
  servicio: string;
};
type EstadoValido =
  | "pendiente"
  | "en curso"
  | "completado"
  | "cancelado"
  | "sin estado";

export default function TareasPage() {
  const [tareas, setTareas] = useState<Tareas[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const obraId = searchParams.get("obraId");
  const servicioId = searchParams.get("servicioId");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/obras/tareas`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("📦 Datos recibidos desde backend:", data);
        if (Array.isArray(data)) {
          setTareas(data);
        } else {
          console.error("❌ Error: los datos no son un array:", data);
          setTareas([]);
          alert(
            "No se encontraron tareas o la respuesta del servidor es incorrecta"
          );
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener tareas:", err);
        setLoading(false);
      });
  }, []);

  const handleEliminar = (tarea: Tareas) => {
    if (!tarea?.id || isNaN(Number(tarea.id))) {
      alert("ID de tarea no válido");
      return;
    }

    if (confirm(`¿Eliminar tarea "${tarea.nombre}"?`)) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/obras/tareas/${tarea.id}`, {
        method: "DELETE",
        credentials: "include",
      })
        .then((res) => {
          if (!res.ok) throw new Error("Error al eliminar tarea");
          return res.json();
        })
        .then(() => {
          setTareas((prev) => prev.filter((o) => o.id !== tarea.id));
          alert("Tarea eliminada");
        })
        .catch((err) => {
          console.error("❌ Error al eliminar tarea:", err);
          alert("Error al eliminar la tarea");
        });
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

    // ✅ Verificar si el estado existe en el config, sino usar "sin estado"
    const estadoKey = estado.toLowerCase() as EstadoValido;
    return estadosConfig[estadoKey] || estadosConfig["sin estado"];
  };
  const columnas = [
    { clave: "nombre", encabezado: "Nombre" },
    {
      clave: "estado",
      encabezado: "Estado",
      // ✅ Render personalizado con color e icono
      render: (valor: string, registro: Tareas) => {
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
              fontWeight: "500",
              color: estilo.color,
              backgroundColor: estilo.backgroundColor,
              border: `1px solid ${estilo.color}20`, // 20 es para transparencia
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
    <main>
      <div className={styles.tareasContainer}>
        <div className={styles.header}>
          <h1>Listado de tareas</h1>
          {/**   <button
            className={styles.botonCrear}
            onClick={() => router.push('/obras/tareas/create')}
          >
            + Crear Tareas
          </button>*/}
        </div>

        {loading ? (
          <p>Cargando tareas...</p>
        ) : (
          <TablaListado
            titulo=""
            columnas={columnas}
            datos={tareas}
            onVer={(tarea) => router.push(`/obras/tareas/${tarea.id}`)}
            onEditar={(tarea) =>
              router.push(`/obras/tareas/${tarea.id}?edit=true`)
            }
            onEliminar={handleEliminar}
            mostrarImportar={false}
          />
        )}
      </div>
    </main>
  );
}

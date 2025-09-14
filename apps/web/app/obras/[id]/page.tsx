"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import FormularioTabla from "../../components/FormularioTabla";
import TreeViewServiciosTareas from "../../components/TreeViewServiciosTareas/TreeViewServiciosTareas";
import CrearPresupuestoBtn from "../../components/CrearPresupuestoBtn";
import type { Columna } from "../../components/TablaListado";
import TablaListado from "../../components/TablaListado";
import { RequirePermiso, usePermisos } from "../../lib/permisos";

type Presupuesto = {
  id: number;
  descripcion: string;
  importe: number;
  estado?: string;
  createdAt?: string;
  nombre?: string;
  aceptado?: boolean;
};

const campos = [
  { nombre: "nombre", etiqueta: "Nombre de la obra" },
  { nombre: "direccion", etiqueta: "Dirección" },
  { nombre: "fechaInicio", etiqueta: "Fecha de inicio", tipo: "date" },
  { nombre: "fechaFin", etiqueta: "Fecha de fin", tipo: "date" },
  {
    nombre: "estadoId",
    etiqueta: "Estado",
    tipo: "selectorTabla",
    tabla: "estados",
    campoLabel: "nombre",
    campoValue: "id",
  },
  {
    nombre: "clienteId",
    etiqueta: "Cliente",
    tipo: "selectorTabla",
    tabla: "clientes",
    campoLabel: "nombre",
    campoValue: "id",
  },
];

const columnas: Columna[] = [
  { clave: "nombre", encabezado: "Nombre", tipo: "texto" },
  { clave: "createdAt", encabezado: "Fecha", tipo: "texto" },
  {
    clave: "importe",
    encabezado: "Importe",
    tipo: "texto",
    render: (valor: number) => `${Number(valor ?? 0).toFixed(2)} €`,
  },
  { clave: "aceptado", encabezado: "Aceptado", tipo: "checkbox" },
];

export default function VerEditarObra() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const modoEdicionQuery = searchParams.get("edit") === "true";
  const [valores, setValores] = useState<any>({
    nombre: "",
    direccion: "",
    fechaInicio: "",
    fechaFin: "",
    email: "",
    telefono: "",
    clienteId: "",
    estadoId: "",
  });
  const [cargando, setCargando] = useState(true);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);

  // permisos
  const { loading: permisosLoading, can } = usePermisos();
  const puedeVerObras = can("obras", "ver");
  const puedeEditarObras = can("obras", "editar");
  const puedeVerPresupuestos = can("presupuestos", "ver");
  const puedeCrearPresupuestos = can("presupuestos", "crear");
  const puedeEditarPresupuestos = can("presupuestos", "editar");
  const puedeEliminarPresupuestos = can("presupuestos", "eliminar");
  const puedeVerTareas = can("tareas", "ver") || can("servicios", "ver");

  // Si viene con ?edit=true pero no tiene permiso, redirige a /403
  useEffect(() => {
    if (permisosLoading) return;
    if (modoEdicionQuery && !puedeEditarObras) {
      router.replace("/403");
    }
  }, [permisosLoading, modoEdicionQuery, puedeEditarObras, router]);

  // Cargar presupuestos de la obra (solo si puede ver presupuestos)
  useEffect(() => {
    if (!id || permisosLoading || !puedeVerPresupuestos) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/presupuestos/por-obra/${id}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPresupuestos(data);
        } else {
          console.error(
            "❌ La respuesta de presupuestos no es un array:",
            data
          );
          setPresupuestos([]);
        }
      })
      .catch((err) => {
        console.error("❌ Error al obtener presupuestos:", err);
        setPresupuestos([]);
      });
  }, [id, permisosLoading, puedeVerPresupuestos]);

  // Cargar datos de la obra
  useEffect(() => {
    if (!id || permisosLoading || !puedeVerObras) return;

    // ⚠️ IMPORTANTE: endpoint correcto en minúsculas
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/obras/${id}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        // Ajuste de fechas al formato yyyy-mm-dd para inputs tipo date
        const obraFormateada = {
          ...data,
          fechaInicio: data?.fechaInicio
            ? String(data.fechaInicio).split("T")[0]
            : "",
          fechaFin: data?.fechaFin ? String(data.fechaFin).split("T")[0] : "",
        };
        setValores(obraFormateada);
        setCargando(false);
      })
      .catch((err) => {
        console.error("Error al obtener Obra:", err);
        setCargando(false);
      });
  }, [id, permisosLoading, puedeVerObras]);

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev: any) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    if (!puedeEditarObras) {
      alert("No tienes permiso para editar esta obra.");
      return;
    }
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/obras/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(valores),
    });

    if (res.ok) {
      alert("Obra actualizada");
      router.push("/obras");
    } else {
      const e = await res.json().catch(() => ({}));
      alert(e?.error || "Error al actualizar");
    }
  };

  const handleEliminarPresupuesto = async (presupuestoId: number) => {
    if (!puedeEliminarPresupuestos) {
      alert("No tienes permiso para eliminar presupuestos.");
      return;
    }
    if (!confirm("¿Estás seguro de eliminar este presupuesto?")) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/presupuestos/${presupuestoId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (res.ok) {
        setPresupuestos((prev) => prev.filter((p) => p.id !== presupuestoId));
      } else {
        const e = await res.json().catch(() => ({}));
        alert(e?.error || "Error al eliminar presupuesto");
      }
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar el presupuesto");
    }
  };

  if (cargando || permisosLoading) return <p>Cargando Obra...</p>;

  const modoEdicionHabilitado = modoEdicionQuery && puedeEditarObras;

  return (
    <RequirePermiso modulo="obras" accion="ver">
      <div className="contenedor-formulario">
        <FormularioTabla
          titulo={modoEdicionHabilitado ? "Editar Obra" : "Detalle de la Obra"}
          campos={campos}
          valores={valores}
          onChange={modoEdicionHabilitado ? handleChange : undefined}
          onSubmit={modoEdicionHabilitado ? handleSubmit : undefined}
          botonTexto="Guardar cambios"
          soloLectura={!modoEdicionHabilitado}
        />

        {/* Crear presupuesto solo si hay cliente y permiso de crear */}
        {!cargando && valores.clienteId && puedeCrearPresupuestos && (
          <div className="alineado-boton">
            <CrearPresupuestoBtn
              clienteId={Number(valores.clienteId)}
              obraId={Number(id)}
              nombre={`Presupuesto para ${valores.nombre}`}
              descripcion={`Presupuesto generado desde la obra "${valores.nombre}"`}
              onSuccess={(presupuesto) => {
                router.push(`/obras/presupuestos/${presupuesto.id}?edit=true`);
              }}
            />
          </div>
        )}

        {/* Tabla de presupuestos solo si puede verlos */}
        {puedeVerPresupuestos && (
          <TablaListado
            titulo="Presupuestos vinculados"
            columnas={columnas}
            datos={presupuestos}
            onVer={(presupuesto) =>
              puedeVerPresupuestos &&
              router.push(`/obras/presupuestos/${presupuesto.id}`)
            }
            onEditar={(presupuesto) =>
              puedeEditarPresupuestos &&
              router.push(`/obras/presupuestos/${presupuesto.id}?edit=true`)
            }
            onEliminar={(p) => handleEliminarPresupuesto(p.id)}
            mostrarImportar={false}
            registrosPorPagina={10}
          />
        )}

        {/* Árbol servicios/tareas solo si tiene permiso de ver tareas/servicios */}
        {!cargando && id && puedeVerTareas && (
          <TreeViewServiciosTareas obraId={Number(id)} />
        )}
      </div>
    </RequirePermiso>
  );
}

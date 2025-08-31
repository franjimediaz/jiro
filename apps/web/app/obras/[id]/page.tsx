"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import FormularioTabla from "../../components/FormularioTabla";
import TreeViewServiciosTareas from "../../components/TreeViewServiciosTareas/TreeViewServiciosTareas";
import CrearPresupuestoBtn from "../../components/CrearPresupuestoBtn";
import type { Columna } from "../../components/TablaListado";
import TablaListado from "../../components/TablaListado";

type Presupuesto = {
  id: number;
  descripcion: string;
  importe: number;
  estado: string;
  fecha: string;
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
  { clave: "descripción", encabezado: "Descripción", tipo: "texto" },
  { clave: "createdAt", encabezado: "Fecha", tipo: "texto" },
  { clave: "importe", encabezado: "€", tipo: "texto" },
  { clave: "aceptado", encabezado: "Aceptado", tipo: "checkbox" },
];

export default function VerEditarObra() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const modoEdicion = searchParams.get("edit") === "true";
  const [valores, setValores] = useState({
    nombre: "",
    direccion: "",
    fechaInicio: "",
    fechaFin: "",
    email: "",
    telefono: "",
    clienteId: "",
  });
  const [cargando, setCargando] = useState(true);

  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);

  useEffect(() => {
    if (!id) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/presupuestos/por-obra/${id}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Datos presupuestos:", data);
        if (Array.isArray(data)) {
          setPresupuestos(data);
        } else {
          console.error("❌ La respuesta no es un array:", data);
          setPresupuestos([]); // prevenir errores en la tabla
        }
      })
      .catch((err) => {
        console.error("❌ Error al obtener presupuestos:", err);
        setPresupuestos([]);
      });
  }, [id]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/Obras/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setValores(data);
        setCargando(false);
        const obraFormateada = {
          ...data,
          fechaInicio: data.fechaInicio?.split("T")[0],
          fechaFin: data.fechaFin?.split("T")[0],
        };

        setValores(obraFormateada);
        setCargando(false);
      })
      .catch((err) => {
        console.error("Error al obtener Obra:", err);
        setCargando(false);
      });
  }, [id]);

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/obras/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(valores),
    });

    if (res.ok) {
      alert("Obra actualizado");
      router.push("/obras");
    } else {
      alert("Error al actualizar");
    }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este presupuesto?")) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/presupuestos/${id}`,
        {
          method: "DELETE",
        }
      );
      if (res.ok) {
        setPresupuestos((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert("Error al eliminar presupuesto");
      }
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar el presupuesto");
    }
  };

  if (cargando) return <p>Cargando Obra...</p>;

  return (
    <div className="contenedor-formulario">
      <FormularioTabla
        titulo={modoEdicion ? "Editar Obra" : "Detalle del Obra"}
        campos={campos}
        valores={valores}
        onChange={modoEdicion ? handleChange : undefined}
        onSubmit={modoEdicion ? handleSubmit : undefined}
        botonTexto="Guardar cambios"
        soloLectura={!modoEdicion}
      />
      {!cargando && valores.clienteId && (
        <div className="alineado-boton">
          <CrearPresupuestoBtn
            clienteId={Number(valores.clienteId)}
            obraId={Number(id)}
            nombre={`Presupuesto para ${valores.nombre}`}
            descripcion={`Presupuesto generado desde la obra "${valores.nombre}"`}
            onSuccess={(presupuesto) => {
              console.log("Presupuesto creado:", presupuesto);
              router.push(`/obras/presupuestos/${presupuesto.id}?edit=true`);
            }}
          />
        </div>
      )}
      <TablaListado
        titulo=""
        columnas={columnas}
        datos={presupuestos}
        onVer={(presupuesto) =>
          router.push(`/obras/presupuestos/${presupuesto.id}`)
        }
        onEditar={(presupuesto) =>
          router.push(`/obras/presupuestos/${presupuesto.id}?edit=true`)
        }
        onEliminar={(presupuestos) => handleEliminar(presupuestos.id)}
        mostrarImportar={false}
        registrosPorPagina={1}
      />
      {!cargando && id && <TreeViewServiciosTareas obraId={Number(id)} />}
    </div>
  );
}

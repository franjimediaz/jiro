"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import DatosEmpresaCliente from "../../../components/DatosEmpresaCliente";
import FormularioTabla from "../../../components/FormularioTabla";
import ArbolPresupuesto from "../../../components/ArbolPresupuesto";
import TablaListado from "../../../components/TablaListado";
import type { Columna } from "../../../components/TablaListado";

type Presupuesto = {
  id: number;
  descripcion: string;
  importe: number;
  estado: string;
  fecha: string;
};

const campos = [
  { nombre: "nombre", etiqueta: "Nombre" },
  { nombre: "descripción", etiqueta: "Descripción del presupuesto" },
  { nombre: "importe", etiqueta: "Importe (€)" },
  { nombre: "aceptado", etiqueta: "¿Aceptado?", tipo: "checkbox" },
  { nombre: "condiciones", etiqueta: "Condiciones", tipo: "richtext" },
];

export default function DetallePresupuesto() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);

  const modoEdicion = searchParams.get("edit") === "true";

  const [presupuesto, setPresupuesto] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [valores, setValores] = useState<any>({
    descripción: "",
    importe: "",
    aceptado: false,
    condiciones: "",
  });
  const columnas: Columna[] = [
    { clave: "descripción", encabezado: "Descripción", tipo: "texto" },
    { clave: "createdAt", encabezado: "Fecha", tipo: "texto" },
    { clave: "importe", encabezado: "€", tipo: "texto" },
    { clave: "aceptado", encabezado: "Aceptado", tipo: "checkbox" },
  ];

  useEffect(() => {
    if (!id) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/presupuestos/${id}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("📦 Presupuesto recibido:", data);
        setPresupuesto(data);
        setValores({
          nombre: data.nombre,
          descripción: data.descripción,
          importe: data.importe,
          aceptado: data.aceptado,
          condiciones: data.condiciones,
        });

        setCargando(false);
      })
      .catch((err) => {
        console.error("Error al cargar presupuesto", err);
        setCargando(false);
      });
  }, [id]);

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

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev: any) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/presupuestos/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valores),
      }
    );

    if (res.ok) {
      alert("Presupuesto actualizado correctamente");
      router.push(`/obras/presupuestos/${id}`);
    } else {
      alert("Error al actualizar presupuesto");
    }
  };

  if (cargando) return <p>Cargando presupuesto...</p>;
  if (!presupuesto) return <p>No se encontró el presupuesto</p>;

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

  return (
    <div>
      {/* ✅ FormularioTabla modo vista o edición */}
      <FormularioTabla
        titulo={modoEdicion ? "Editar Presupuesto" : "Detalle del Presupuesto"}
        campos={campos}
        valores={valores}
        onChange={modoEdicion ? handleChange : undefined}
        onSubmit={modoEdicion ? handleSubmit : undefined}
        botonTexto="Guardar"
        soloLectura={!modoEdicion}
      />
      <TablaListado
        titulo="Facturas asociadas"
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
      {/* ✅ Tarjetas Empresa + Cliente */}
      <DatosEmpresaCliente clienteId={presupuesto.clienteId} />
      <ArbolPresupuesto presupuestoId={presupuesto.id} />

      {/* ✅ Fecha fuera del formulario */}
      {!modoEdicion && (
        <p style={{ marginTop: "1rem" }}>
          <strong>Generado el:</strong>{" "}
          {new Date(presupuesto.createdAt).toLocaleDateString("es-ES")}
        </p>
      )}
    </div>
  );
}

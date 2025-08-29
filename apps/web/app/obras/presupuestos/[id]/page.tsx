"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import DatosEmpresaCliente from "../../../components/DatosEmpresaCliente";
import FormularioTabla from "../../../components/FormularioTabla";
import ArbolPresupuesto from "../../../components/ArbolPresupuesto";

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

  const modoEdicion = searchParams.get("edit") === "true";

  const [presupuesto, setPresupuesto] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [valores, setValores] = useState<any>({
    descripción: "",
    importe: "",
    aceptado: false,
    condiciones: "",
  });

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

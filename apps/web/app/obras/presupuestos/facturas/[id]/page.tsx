"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import FormularioTabla from "../../../../components/FormularioTabla";

const campos = [
  {
    titulo: "Identificación",
    descripcion: "",
    expandible: true,
    expandidaPorDefecto: false,
    campos: [
      { nombre: "id", etiqueta: "Número", readOnly: true },

      {
        nombre: "referencia",
        etiqueta: "Referencia",
        tipo: "text",
        readOnly: true,
      },
      { nombre: "fecha", etiqueta: "Fecha", tipo: "date", readOnly: true },

      {
        nombre: "cobrada",
        etiqueta: "Cobrada",
        tipo: "checkbox",
        readOnly: true,
      },
      {
        nombre: "cantidad",
        etiqueta: "Cantidad",
        tipo: "number",
        readOnly: true,
      },
      {
        nombre: "presupuestoId",
        readOnly: true,
        etiqueta: "Presupuesto",
        tipo: "selectorTabla",
        tabla: "presupuestos",
        campoLabel: "nombre",
        campoValue: "id",
      },
    ],
  },
  {
    titulo: "Identificación",
    descripcion: "",
    expandible: true,
    expandidaPorDefecto: true,
    campos: [
      { nombre: "descripcion", etiqueta: "Descripción", tipo: "textarea" },
      {
        nombre: "estado",
        etiqueta: "Estado",
        tipo: "select",
        opciones: [
          { value: "pagado", label: "Pagado" },
          { value: "pendiente", label: "Pendiente" },
          { value: "cancelado", label: "Cancelado" },
        ],
      },
    ],
  },
  {
    titulo: "Tracking",
    descripcion: "",
    expandible: true,
    expandidaPorDefecto: false,
    campos: [
      {
        nombre: "createdAt",
        etiqueta: "Creado en",
        tipo: "text",
        readOnly: true,
      },
      {
        nombre: "updatedAt",
        etiqueta: "Actualizado en",
        tipo: "text",
        readOnly: true,
      },
    ],
  },
];

export default function VerEditarFactura() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const modoEdicion = searchParams.get("edit") === "true";
  const [valores, setValores] = useState({
    id: "",
    numero: "",
    descripcion: "",
    referencia: "",
    fecha: "",
    importe: "",
    estado: "",
    cobrada: false,
    cantidad: "",
    presupuestoId: "",
    createdAt: "",
    updatedAt: "",
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/facturas/${id}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setValores(data);
        setCargando(false);
      })
      .catch((err) => {
        console.error("Error al obtener Factura:", err);
        setCargando(false);
      });
  }, [id]);

  const handleChange = (nombre: string, valor: any) => {
    if (nombre === "estado") {
      if (valor === "pagado") {
        // ✅ Si cambia a "pagado", cobrada = true
        setValores((prev) => ({
          ...prev,
          estado: valor,
          cobrada: true,
        }));
      } else {
        // ✅ Si cambia a cualquier otro estado, cobrada = false
        setValores((prev) => ({
          ...prev,
          estado: valor,
          cobrada: false,
        }));
      }
    } else if (nombre === "cobrada" && valores.estado === "pagado") {
      // ✅ No permitir cambiar cobrada si está pagado
      console.log("No se puede cambiar 'cobrada' cuando el estado es 'pagado'");
      return;
    } else {
      setValores((prev) => ({ ...prev, [nombre]: valor }));
    }
  };

  const handleSubmit = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/facturas/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valores),
        credentials: "include",
      }
    );

    if (res.ok) {
      alert("Factura actualizado");
      router.push("/obras/presupuestos/facturas");
    } else {
      alert("Error al actualizar");
    }
  };

  if (cargando) return <p>Cargando Factura...</p>;

  return (
    <>
      <FormularioTabla
        titulo={modoEdicion ? "Editar Factura" : "Detalle del Factura"}
        secciones={campos}
        valores={valores}
        onChange={modoEdicion ? handleChange : undefined}
        onSubmit={modoEdicion ? handleSubmit : undefined}
        botonTexto="Guardar cambios"
        soloLectura={!modoEdicion}
      />
    </>
  );
}

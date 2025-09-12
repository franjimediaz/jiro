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
type Factura = {
  id: number;
  numero?: string;
  descripcion: string;
  importe: number;
  estado: "pendiente" | "pagada" | "cancelada";
  presupuestoId: number;
  createdAt: string;
  updatedAt?: string;
  presupuesto?: {
    descripcion: string;
    nombre?: string;
    importe: number;
  };
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
  const [facturas, setFacturas] = useState<Factura[]>([]);

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
    { clave: "referencia", encabezado: "Referencia", tipo: "texto" },
    { clave: "descripcion", encabezado: "Descripción", tipo: "texto" },
    {
      clave: "createdAt",
      encabezado: "Fecha",
      tipo: "texto",
      render: (valor: string) => new Date(valor).toLocaleDateString("es-ES"),
    },
    {
      clave: "cantidad",
      encabezado: "Importe",
      tipo: "texto",
      render: (valor: number) => `${valor?.toFixed(2) || "0.00"} €`,
    },
    {
      clave: "estado",
      encabezado: "Estado",
      tipo: "texto",
      render: (valor: string) => (
        <span
          style={{
            padding: "0.25rem 0.5rem",
            borderRadius: "4px",
            fontSize: "0.8rem",
            fontWeight: "bold",
            backgroundColor: valor === "pagada" ? "#d1fae5" : "#fef3c7",
            color: valor === "pagada" ? "#065f46" : "#92400e",
          }}
        >
          {valor || "pendiente"}
        </span>
      ),
    },
  ];
  useEffect(() => {
    if (!id) return;

    console.log("🧾 Buscando facturas para presupuesto ID:", id);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/facturas/por-presupuesto/${id}`, {
      credentials: "include",
    })
      .then((res) => {
        console.log("📡 Response facturas:", res.status);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Factura[]) => {
        // ✅ Tipado como array de Facturas
        console.log("✅ Facturas recibidas:", data);
        console.log("🔢 Cantidad de facturas:", data.length);

        // ✅ Validar que sea un array
        if (Array.isArray(data)) {
          setFacturas(data);
        } else {
          console.error("❌ La respuesta no es un array:", data);
          setFacturas([]);
        }
      })
      .catch((err) => {
        console.error("❌ Error al obtener facturas:", err);
        setFacturas([]);
      });
  }, [id]);

  useEffect(() => {
    if (!id) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/presupuestos/${id}  `, {
      credentials: "include",
    })
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

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/presupuestos/por-obra/${id}`, {
      credentials: "include",
    })
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
        credentials: "include",
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

  const handleEliminar = async (factura: any) => {
    if (
      !confirm(
        `¿Estás seguro de eliminar la factura "${factura.numero || factura.descripcion}"?`
      )
    )
      return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/facturas/${factura.id}`,
        { method: "DELETE", credentials: "include" }
      );

      if (res.ok) {
        // ✅ Actualizar el estado eliminando la factura
        setFacturas((prev) => prev.filter((f) => f.id !== factura.id));
        alert("Factura eliminada correctamente");
      } else {
        alert("Error al eliminar la factura");
      }
    } catch (err) {
      console.error("Error al eliminar factura:", err);
      alert("No se pudo eliminar la factura");
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
        datos={facturas}
        onVer={(factura) =>
          router.push(`/obras/presupuestos/facturas/${factura.id}`)
        }
        onEditar={(factura) =>
          router.push(`/obras/presupuestos/facturas/${factura.id}?edit=true`)
        }
        onEliminar={(factura) => handleEliminar(factura.id)}
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

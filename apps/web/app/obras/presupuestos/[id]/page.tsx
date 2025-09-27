"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import DatosEmpresaCliente from "../../../components/DatosEmpresaCliente";
import { FormularioTabla, TablaListado } from "@repo/ui";
import ArbolPresupuesto from "../../../components/ArbolPresupuesto";
import { Columna } from "@repo/shared/types";
import { RequirePermiso, usePermisos } from "../../../lib/permisos";

type Presupuesto = {
  id: number;
  nombre: string;
  descripcion: string; // <- sin tilde
  importe: number;
  aceptado: boolean;
  condiciones?: string | null;
  clienteId: number;
  createdAt: string;
};

type Factura = {
  id: number;
  numero?: string | null;
  descripcion?: string | null;
  referencia?: string | null;
  cantidad?: number | null; // tu backend usa "cantidad" como importe facturado
  estado?: string | null; // "pendiente" | "pagado" | "cancelado" (según backend)
  createdAt: string;
};

const campos = [
  { nombre: "nombre", etiqueta: "Nombre" },
  { nombre: "descripcion", etiqueta: "Descripción del presupuesto" }, // <- sin tilde
  { nombre: "importe", etiqueta: "Importe (€)" },
  { nombre: "aceptado", etiqueta: "¿Aceptado?", tipo: "checkbox" },
  { nombre: "condiciones", etiqueta: "Condiciones", tipo: "richtext" },
];

export default function DetallePresupuesto() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const { can } = usePermisos();
  const puedeEditarPres = can("presupuestos", "editar");
  const puedeVerFacturas = can("facturas", "ver");
  const puedeEditarFacturas = can("facturas", "editar");
  const puedeEliminarFacturas = can("facturas", "eliminar");

  const modoEdicion = searchParams.get("edit") === "true";

  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [cargando, setCargando] = useState(true);

  const [valores, setValores] = useState<any>({
    nombre: "",
    descripcion: "",
    importe: "",
    aceptado: false,
    condiciones: "",
  });

  // ---------------------------
  // Cargar presupuesto por id
  // ---------------------------
  useEffect(() => {
    if (!id) return;

    const cargar = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/presupuestos/${id}`,
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

        const data = await res.json();
        // Normalizamos al shape esperado
        const p: Presupuesto = {
          id: data.id,
          nombre: data.nombre,
          descripcion: data.descripcion, // <- sin tilde
          importe: data.importe,
          aceptado: data.aceptado,
          condiciones: data.condiciones ?? "",
          clienteId: data.clienteId,
          createdAt: data.createdAt,
        };
        setPresupuesto(p);
        setValores({
          nombre: p.nombre,
          descripcion: p.descripcion,
          importe: p.importe,
          aceptado: p.aceptado,
          condiciones: p.condiciones ?? "",
        });
      } catch (e) {
        console.error("Error al cargar presupuesto:", e);
      } finally {
        setCargando(false);
      }
    };

    cargar();
  }, [id, router]);

  // -----------------------------------
  // Cargar facturas del presupuesto
  // -----------------------------------
  useEffect(() => {
    if (!id) return;

    const cargarFacturas = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/facturas/por-presupuesto/${id}`,
          { credentials: "include" }
        );

        if (res.status === 401) {
          if (typeof window !== "undefined") window.location.href = "/login";
          return;
        }
        if (res.status === 403) {
          router.replace("/403");
          return;
        }

        const data = await res.json();
        setFacturas(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error al obtener facturas:", err);
        setFacturas([]);
      }
    };

    cargarFacturas();
  }, [id, router]);

  // ---------------------------
  // Edición presupuesto
  // ---------------------------
  const handleChange = (nombre: string, valor: any) => {
    setValores((prev: any) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    // Aseguramos tipos válidos
    const payload = {
      ...valores,
      descripcion: valores.descripcion ?? "",
      importe:
        typeof valores.importe === "string"
          ? parseFloat(valores.importe || "0")
          : (valores.importe ?? 0),
    };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/presupuestos/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
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

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(
          `Error al actualizar presupuesto${err?.error ? `: ${err.error}` : ""}`
        );
        return;
      }

      alert("Presupuesto actualizado correctamente");
      router.push(`/obras/presupuestos/${id}`);
    } catch (e) {
      console.error(e);
      alert("Error al actualizar presupuesto");
    }
  };

  // ---------------------------
  // Eliminar factura
  // ---------------------------
  const handleEliminarFactura = async (f: Factura) => {
    if (!puedeEliminarFacturas) return;
    if (
      !confirm(
        `¿Eliminar la factura "${f.numero ?? f.descripcion ?? f.referencia ?? f.id}"?`
      )
    )
      return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/facturas/${f.id}`,
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
      if (!res.ok) throw new Error("Error al eliminar");

      setFacturas((prev) => prev.filter((x) => x.id !== f.id));
      alert("Factura eliminada correctamente");
    } catch (err) {
      console.error("Error al eliminar factura:", err);
      alert("No se pudo eliminar la factura");
    }
  };

  // ---------------------------
  // Columnas facturas
  // ---------------------------
  const columnas: Columna[] = useMemo(
    () => [
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
        render: (valor: number) =>
          typeof valor === "number" ? `${valor.toFixed(2)} €` : "0,00 €",
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
              backgroundColor: valor === "pagado" ? "#d1fae5" : "#fef3c7",
              color: valor === "pagado" ? "#065f46" : "#92400e",
            }}
          >
            {valor || "pendiente"}
          </span>
        ),
      },
    ],
    []
  );

  if (cargando) return <p>Cargando presupuesto...</p>;
  if (!presupuesto) return <p>No se encontró el presupuesto</p>;

  return (
    <RequirePermiso modulo="presupuestos" accion="ver">
      <div>
        {/* Formulario (editable solo si tiene permiso) */}
        <FormularioTabla
          titulo={
            modoEdicion ? "Editar Presupuesto" : "Detalle del Presupuesto"
          }
          campos={campos}
          valores={valores}
          onChange={modoEdicion && puedeEditarPres ? handleChange : undefined}
          onSubmit={modoEdicion && puedeEditarPres ? handleSubmit : undefined}
          botonTexto="Guardar"
          soloLectura={!modoEdicion || !puedeEditarPres}
        />

        {/* Tabla de facturas */}
        <TablaListado
          titulo="Facturas asociadas"
          columnas={columnas}
          datos={facturas}
          onVer={
            puedeVerFacturas
              ? (factura) =>
                  router.push(`/obras/presupuestos/facturas/${factura.id}`)
              : undefined
          }
          onEditar={
            puedeEditarFacturas
              ? (factura) =>
                  router.push(
                    `/obras/presupuestos/facturas/${factura.id}?edit=true`
                  )
              : undefined
          }
          onEliminar={
            puedeEliminarFacturas
              ? (factura) => handleEliminarFactura(factura)
              : undefined
          }
          mostrarImportar={false}
          registrosPorPagina={5}
        />

        {/* Tarjetas Empresa + Cliente */}
        <DatosEmpresaCliente clienteId={presupuesto.clienteId} />
        <ArbolPresupuesto presupuestoId={presupuesto.id} />

        {/* Fecha fuera del formulario */}
        {!modoEdicion && (
          <p style={{ marginTop: "1rem" }}>
            <strong>Generado el:</strong>{" "}
            {new Date(presupuesto.createdAt).toLocaleDateString("es-ES")}
          </p>
        )}
      </div>
    </RequirePermiso>
  );
}

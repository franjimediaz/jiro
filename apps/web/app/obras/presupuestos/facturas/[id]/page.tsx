"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { FormularioTabla } from "@repo/ui";
import { RequirePermiso, usePermisos } from "../../../../lib/permisos";

type Factura = {
  id: number;
  numero?: string | null;
  descripcion?: string | null;
  referencia: string;
  fecha: string; // ISO
  importe?: number | null;
  estado: "pendiente" | "pagado" | "cancelado" | string;
  cobrada: boolean;
  cantidad?: number | null;
  presupuestoId: number;
  createdAt?: string | null;
  updatedAt?: string | null;
};

const secciones = [
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
        etiqueta: "Presupuesto",
        tipo: "selectorTabla",
        tabla: "presupuestos",
        campoLabel: "nombre",
        campoValue: "id",
        readOnly: true,
      },
    ],
  },
  {
    titulo: "Detalles",
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

  const { can } = usePermisos();
  const puedeEditar = can("facturas", "editar");

  // Solo entrará aquí si tiene 'ver' por el RequirePermiso; el modo edición además pide 'editar'
  const quiereEditar = searchParams.get("edit") === "true";
  const modoEdicion = quiereEditar && puedeEditar;

  const [valores, setValores] = useState<any>({
    id: "",
    numero: "",
    descripcion: "",
    referencia: "",
    fecha: "",
    importe: "",
    estado: "pendiente",
    cobrada: false,
    cantidad: "",
    presupuestoId: "",
    createdAt: "",
    updatedAt: "",
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!id) return;

    const cargar = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/facturas/${id}`,
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

        const data: Factura = await res.json();

        // Normalizar valores para el formulario
        const fechaISO = data.fecha ? new Date(data.fecha).toISOString() : "";
        const fechaYMD = fechaISO ? fechaISO.slice(0, 10) : ""; // YYYY-MM-DD para input date
        const createdTxt = data.createdAt
          ? new Date(data.createdAt).toLocaleString("es-ES")
          : "";
        const updatedTxt = data.updatedAt
          ? new Date(data.updatedAt).toLocaleString("es-ES")
          : "";

        setValores({
          id: data.id,
          numero: data.numero ?? "",
          descripcion: data.descripcion ?? "",
          referencia: data.referencia ?? "",
          fecha: fechaYMD,
          importe: data.importe ?? "",
          estado: data.estado ?? "pendiente",
          cobrada: Boolean(data.cobrada),
          cantidad: data.cantidad ?? "",
          presupuestoId: data.presupuestoId ?? "",
          createdAt: createdTxt,
          updatedAt: updatedTxt,
        });
      } catch (err) {
        console.error("Error al obtener Factura:", err);
      } finally {
        setCargando(false);
      }
    };

    cargar();
  }, [id, router]);

  // Si pidió ?edit=true pero no tiene permiso de editar, lo llevamos a 403
  useEffect(() => {
    if (quiereEditar && !puedeEditar) {
      router.replace("/403");
    }
  }, [quiereEditar, puedeEditar, router]);

  const handleChange = (nombre: string, valor: any) => {
    if (nombre === "estado") {
      if (valor === "pagado") {
        setValores((prev: any) => ({ ...prev, estado: valor, cobrada: true }));
      } else {
        setValores((prev: any) => ({ ...prev, estado: valor, cobrada: false }));
      }
      return;
    }

    if (nombre === "cobrada" && valores.estado === "pagado") {
      // No permitir cambiar 'cobrada' si el estado es 'pagado'
      return;
    }

    setValores((prev: any) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    // Saneamos tipos: números/fechas
    const payload = {
      ...valores,
      // Si el backend ya maneja 'fecha' como ISO, puedes dejarla tal cual (aquí está en YYYY-MM-DD)
      fecha: valores.fecha
        ? new Date(valores.fecha).toISOString()
        : valores.fecha,
      cantidad:
        valores.cantidad === "" || valores.cantidad === null
          ? null
          : Number(valores.cantidad),
      importe:
        valores.importe === "" || valores.importe === null
          ? null
          : Number(valores.importe),
      presupuestoId:
        valores.presupuestoId === "" || valores.presupuestoId === null
          ? null
          : Number(valores.presupuestoId),
    };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/facturas/${id}`,
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
        alert(`Error al actualizar: ${err?.error || "Error desconocido"}`);
        return;
      }

      alert("Factura actualizada");
      router.push("/obras/presupuestos/facturas");
    } catch (err) {
      console.error("Error al actualizar:", err);
      alert("Error al actualizar");
    }
  };

  if (cargando) return <p>Cargando Factura...</p>;

  return (
    <RequirePermiso modulo="facturas" accion="ver">
      <FormularioTabla
        titulo={modoEdicion ? "Editar Factura" : "Detalle de la Factura"}
        secciones={secciones}
        valores={valores}
        onChange={modoEdicion ? handleChange : undefined}
        onSubmit={modoEdicion ? handleSubmit : undefined}
        botonTexto="Guardar cambios"
        soloLectura={!modoEdicion}
      />
    </RequirePermiso>
  );
}

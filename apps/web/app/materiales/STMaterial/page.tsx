"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormularioTabla } from "@repo/ui";
import { RequirePermiso } from "../../lib/permisos";

const campos = [
  {
    nombre: "ServicioTareaId",
    etiqueta: "ID Servicio/Tarea",
    tipo: "readonly",
  },
  {
    nombre: "materialesId",
    etiqueta: "Material",
    tipo: "selectorTabla",
    tabla: "materiales",
    campoLabel: "nombre",
    campoValue: "id",
  },
  { nombre: "cantidad", etiqueta: "Cantidad" },
  { nombre: "preciounidad", etiqueta: "€/Ud" },
  { nombre: "total", etiqueta: "Total", tipo: "readonly" },
  { nombre: "facturable", etiqueta: "Facturable", tipo: "checkbox" },
];

export default function Nuevamaterial() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [valores, setValores] = useState({
    ServicioTareaId: Number(searchParams.get("servicioTareaId")) || "",
    materialesId: "",
    cantidad: "",
    preciounidad: "",
    total: "",
    facturable: false,
  });

  // Recalcular total al cambiar cantidad o precio unidad
  useEffect(() => {
    const cantidad = parseFloat(valores.cantidad) || 0;
    const precioUnidad = parseFloat(valores.preciounidad) || 0;
    const total = cantidad * precioUnidad;
    setValores((prev) => ({ ...prev, total: total.toFixed(2) }));
  }, [valores.cantidad, valores.preciounidad]);

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    const payload = {
      ServicioTareaId: Number(valores.ServicioTareaId),
      materialesId: Number(valores.materialesId),
      cantidad: parseFloat(valores.cantidad) || 0,
      preciounidad: parseFloat(valores.preciounidad) || 0,
      total: parseFloat(valores.total) || 0,
      facturable: Boolean(valores.facturable),
    };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/st_material`,
        {
          method: "POST",
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

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        alert("Material asignado correctamente");
        router.back();
      } else {
        const msg =
          (data && (data.error || data.message || data.detalle)) ||
          "Error desconocido";
        console.error("❌ Backend respondió error:", data);
        alert("❌ Error al asignar material: " + msg);
      }
    } catch (error) {
      console.error("❌ Error inesperado:", error);
      alert("❌ Error inesperado al asignar material.");
    }
  };

  return (
    <RequirePermiso modulo="materiales" accion="crear">
      <FormularioTabla
        titulo="Crear Nuevo material"
        campos={campos}
        valores={valores}
        onChange={handleChange}
        onSubmit={handleSubmit}
        botonTexto="Crear"
      />
    </RequirePermiso>
  );
}

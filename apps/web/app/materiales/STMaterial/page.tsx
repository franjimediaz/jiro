"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FormularioTabla from "../../components/FormularioTabla";

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
      cantidad: parseFloat(valores.cantidad),
      preciounidad: parseFloat(valores.preciounidad),
      total: parseFloat(valores.total),
      facturable: Boolean(valores.facturable),
    };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/st_material`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        }
      );

      const data = await res.json(); // ✅ leer contenido

      if (res.ok) {
        alert("Material asignado correctamente");
        router.back();
      } else {
        console.error("❌ Backend respondió error:", data);
        alert("❌ Error al asignar material: " + data.error);
      }
    } catch (error) {
      console.error("❌ Error inesperado:", error);
      alert("❌ Error inesperado al asignar material.");
    }
  };

  return (
    <FormularioTabla
      titulo="Crear Nuevo material"
      campos={campos}
      valores={valores}
      onChange={handleChange}
      onSubmit={handleSubmit}
      botonTexto="Crear"
    />
  );
}

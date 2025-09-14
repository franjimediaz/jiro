"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormularioTabla from "../../components/FormularioTabla";
import { RequirePermiso } from "../../lib/permisos";

const campos = [
  { nombre: "nombre", etiqueta: "Nombre del material" },
  { nombre: "descripcion", etiqueta: "Descripción" },
  { nombre: "precio", etiqueta: "Precio (€)" },
  { nombre: "proveedor", etiqueta: "Proveedor" },
  { nombre: "stockActual", etiqueta: "Stock" },
  { nombre: "unidadMedida", etiqueta: "Unidad (kg, m2, l...)" },
];

export default function Nuevamaterial() {
  const router = useRouter();

  const [valores, setValores] = useState({
    nombre: "",
    descripcion: "",
    precio: "", // string en UI → se convierte a número en el payload
    proveedor: "",
    stockActual: "", // opcional
    unidadMedida: "", // opcional
  });

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    // Construimos el payload con tipos correctos
    const payload: any = {
      nombre: valores.nombre?.trim(),
      descripcion: valores.descripcion?.trim(),
      // En tu schema Prisma precio es Int → usamos parseInt
      precio: Number.isFinite(parseFloat(valores.precio))
        ? Math.round(parseFloat(valores.precio))
        : 0,
      proveedor: valores.proveedor?.trim(),
    };

    if (valores.stockActual !== "") {
      const stock = parseInt(valores.stockActual, 10);
      if (Number.isFinite(stock)) payload.stockActual = stock;
    }

    if (valores.unidadMedida?.trim()) {
      payload.unidadMedida = valores.unidadMedida.trim();
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/materiales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

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
        alert("Material creado correctamente");
        router.push("/materiales"); // o router.back() si prefieres volver
      } else {
        const msg =
          (data && (data.error || data.message || data.detalle)) ||
          "Error desconocido";
        alert("Error al crear material: " + msg);
      }
    } catch (err) {
      console.error("❌ Error al crear material:", err);
      alert("No se pudo crear el material. Revisa consola para más detalles.");
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

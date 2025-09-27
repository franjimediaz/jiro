"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormularioTabla } from "@repo/ui";
import { RequirePermiso } from "../../../lib/permisos";

const campos = [
  {
    nombre: "nombre",
    etiqueta: "Nombre del servicio",
    placeholder: "Ej. Albañilería",
  },
  { nombre: "color", etiqueta: "Color", placeholder: "#FFAA00", tipo: "color" },
  {
    nombre: "icono",
    etiqueta: "Icono",
    placeholder: "fa-hammer",
    tipo: "icono",
  },
];

export default function CrearServicioPage() {
  const router = useRouter();
  const [valores, setValores] = useState({
    nombre: "",
    color: "",
    icono: "",
  });
  const [enviando, setEnviando] = useState(false);

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    if (!valores.nombre?.trim()) {
      alert("El nombre del servicio es obligatorio.");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/servicios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(valores),
      });

      if (res.status === 401) {
        if (typeof window !== "undefined") window.location.href = "/login";
        return;
      }
      if (res.status === 403) {
        router.replace("/403");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Error al crear el servicio");
      }

      alert("Servicio creado correctamente");
      router.push("/obras/servicios");
    } catch (error: any) {
      console.error("Error al crear servicio:", error);
      alert(error?.message || "Error al crear servicio");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <RequirePermiso modulo="servicios" accion="crear">
      <FormularioTabla
        titulo="Crear servicio"
        campos={campos}
        valores={valores}
        onChange={handleChange}
        onSubmit={enviando ? undefined : handleSubmit}
        botonTexto={enviando ? "Creando..." : "Crear servicio"}
      />
    </RequirePermiso>
  );
}

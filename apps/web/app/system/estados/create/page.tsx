"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormularioTabla } from "@repo/ui";
import { RequirePermiso } from "../../../lib/permisos";

const campos = [
  {
    nombre: "nombre",
    etiqueta: "Nombre del Estado",
    placeholder: "Ej. En curso",
  },
  { nombre: "color", etiqueta: "Color", placeholder: "#FFAA00", tipo: "color" },
  {
    nombre: "icono",
    etiqueta: "Icono",
    placeholder: "fa-hammer",
    tipo: "icono",
  },
];

export default function CrearEstado() {
  const router = useRouter();
  const [valores, setValores] = useState({
    nombre: "",
    color: "",
    icono: "",
  });
  const [guardando, setGuardando] = useState(false);

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    if (!valores.nombre?.trim()) {
      alert("El campo 'Nombre' es obligatorio.");
      return;
    }

    try {
      setGuardando(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/estados`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valores),
      });

      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (res.status === 403) {
        router.replace("/403");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Error al crear el estado");
      }

      // Vuelve al listado de estados
      router.push("/system/estados");
    } catch (error) {
      console.error("Error al crear Estado:", error);
      alert(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <RequirePermiso modulo="estados" accion="crear" fallback={null}>
      <FormularioTabla
        titulo="Crear Estado"
        campos={campos}
        valores={valores}
        onChange={handleChange}
        onSubmit={guardando ? undefined : handleSubmit}
        botonTexto={guardando ? "Guardando..." : "Crear Estado"}
      />
    </RequirePermiso>
  );
}

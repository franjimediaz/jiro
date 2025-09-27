"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormularioTabla } from "@repo/ui";
import { RequirePermiso } from "../../lib/permisos";

const campos = [
  { nombre: "nombre", etiqueta: "Nombre de la obra" },
  { nombre: "direccion", etiqueta: "Dirección" },
  { nombre: "fechaInicio", etiqueta: "Fecha de inicio", tipo: "date" },
  { nombre: "fechaFin", etiqueta: "Fecha de fin", tipo: "date" },
  {
    nombre: "estadoId",
    etiqueta: "Estado",
    tipo: "selectorTabla",
    tabla: "estados",
    campoLabel: "nombre",
    campoValue: "id",
  },
  {
    nombre: "clienteId",
    etiqueta: "Cliente",
    tipo: "selectorTabla",
    tabla: "clientes",
    campoLabel: "nombre",
    campoValue: "id",
  },
];

export default function NuevaObra() {
  const router = useRouter();

  const [valores, setValores] = useState({
    nombre: "",
    direccion: "",
    fechaInicio: "",
    fechaFin: "",
    estadoId: "",
    clienteId: "",
  });

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/obras`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(valores),
      });

      // Manejo explícito de 401/403
      if (res.status === 401) {
        // no autenticado
        router.replace("/login");
        return;
      }
      if (res.status === 403) {
        // autenticado pero sin permiso
        router.replace("/403");
        return;
      }

      const data = await res.json().catch(() => ({}) as any);

      if (res.ok) {
        alert("Obra creada correctamente");
        router.push("/obras");
      } else {
        alert(
          `Error al crear la obra: ${data?.detalle || data?.error || "Error desconocido"}`
        );
      }
    } catch (err: any) {
      alert(err?.message || "Error desconocido al crear la obra");
    }
  };

  return (
    <RequirePermiso modulo="obras" accion="crear">
      <FormularioTabla
        titulo="Crear Nueva Obra"
        campos={campos}
        valores={valores}
        onChange={handleChange}
        onSubmit={handleSubmit}
        botonTexto="Crear"
      />
    </RequirePermiso>
  );
}

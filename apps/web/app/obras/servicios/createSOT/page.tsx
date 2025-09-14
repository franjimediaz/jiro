"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import FormularioTabla from "../../../components/FormularioTabla";
import { RequirePermiso } from "../../../lib/permisos";

const campos = [
  {
    nombre: "servicioId",
    etiqueta: "Servicio",
    tipo: "selectorTabla",
    tabla: "servicios",
    campoLabel: "nombre",
    multiple: false,
    campoValue: "id",
  },
  { nombre: "fechaInicio", etiqueta: "Fecha inicio", tipo: "date" },
  { nombre: "fechaFin", etiqueta: "Fecha fin", tipo: "date" },
];

export default function CrearServicioObra() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const obraId = searchParams.get("obraId");

  const [valores, setValores] = useState<any>({
    servicioId: "",
    fechaInicio: "",
    fechaFin: "",
  });
  const [enviando, setEnviando] = useState(false);

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev: any) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    if (!obraId) {
      alert("Falta el ID de la obra.");
      return;
    }
    if (!valores.servicioId) {
      alert("Debes seleccionar un servicio.");
      return;
    }

    setEnviando(true);
    try {
      // 1) Crear la tarea “vacía”
      const resTarea = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/obras/tareas`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: "Tarea sin nombre",
            descripcion: "Descripción pendiente",
            estadoId: 1, // ajusta si tienes otro estado por defecto
          }),
        }
      );

      if (resTarea.status === 401) {
        if (typeof window !== "undefined") window.location.href = "/login";
        return;
      }
      if (resTarea.status === 403) {
        router.replace("/403");
        return;
      }
      if (!resTarea.ok) {
        const err = await resTarea.json().catch(() => ({}));
        throw new Error(err?.error || "Error al crear tarea");
      }

      const tareaCreada = await resTarea.json();

      // 2) Crear relación servicio_tarea
      const payload = {
        obraId: Number(obraId),
        servicioId: Number(valores.servicioId),
        tareaId: tareaCreada.id,
        fechaInicio: valores.fechaInicio || null,
        fechaFin: valores.fechaFin || null,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/servicios_tarea`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
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
        alert("Servicio añadido a la obra");
        router.push(`/obras/${obraId}`);
      } else {
        alert(
          "Error al crear relación servicio-tarea: " +
            (data?.error || "Desconocido")
        );
      }
    } catch (err: any) {
      console.error("❌ Error en handleSubmit:", err);
      alert(err?.message || "Error al crear servicio y tarea");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <RequirePermiso modulo="servicios" accion="crear">
      <FormularioTabla
        titulo="Añadir Servicio"
        campos={campos}
        valores={valores}
        onChange={handleChange}
        onSubmit={enviando ? undefined : handleSubmit}
        botonTexto={enviando ? "Creando..." : "Crear"}
      />
    </RequirePermiso>
  );
}

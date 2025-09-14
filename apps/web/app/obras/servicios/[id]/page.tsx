"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import FormularioTabla from "../../../components/FormularioTabla";
import { RequirePermiso, usePermisos } from "../../../lib/permisos";

const campos = [
  { nombre: "nombre", etiqueta: "Nombre del servicio" },
  { nombre: "color", etiqueta: "Color", tipo: "color" },
  { nombre: "icono", etiqueta: "Icono", tipo: "icono" },
  {
    nombre: "preview",
    etiqueta: "Vista previa",
    tipo: "previsualizacion",
  },
];

export default function VerEditarServicioPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const modoEdicion = searchParams.get("edit") === "true";

  const { loading: permisosLoading, can } = usePermisos();
  const puedeEditar = can("servicios", "editar");

  const [valores, setValores] = useState({
    nombre: "",
    color: "",
    icono: "",
  });
  const [cargando, setCargando] = useState(true);

  // Si viene con ?edit=true pero no tiene permiso de editar, redirige a 403
  useEffect(() => {
    if (!permisosLoading && modoEdicion && !puedeEditar) {
      router.replace("/403");
    }
  }, [permisosLoading, modoEdicion, puedeEditar, router]);

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/servicios/${id}`,
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

        const data = await res.json().catch(() => ({}));
        setValores({
          nombre: data?.nombre ?? "",
          color: data?.color ?? "",
          icono: data?.icono ?? "",
        });
      } catch (err) {
        console.error("Error al obtener Servicio:", err);
      } finally {
        setCargando(false);
      }
    })();
  }, [id, router]);

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/servicios/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(valores),
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
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Error al actualizar");
      }

      alert("Servicio actualizado");
      router.push("/obras/servicios");
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Error al actualizar");
    }
  };

  if (cargando) return <p>Cargando Servicio...</p>;

  return (
    <RequirePermiso modulo="servicios" accion="ver">
      <FormularioTabla
        titulo={modoEdicion ? "Editar Servicio" : "Detalle del Servicio"}
        campos={campos}
        valores={valores}
        onChange={modoEdicion && puedeEditar ? handleChange : undefined}
        onSubmit={modoEdicion && puedeEditar ? handleSubmit : undefined}
        botonTexto={modoEdicion && puedeEditar ? "Guardar cambios" : undefined}
        soloLectura={!modoEdicion || !puedeEditar}
      />
    </RequirePermiso>
  );
}

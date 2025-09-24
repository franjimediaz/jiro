"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { FormularioTabla } from "@repo/ui";
import { RequirePermiso, usePermisos } from "../../lib/permisos";
import {
  Material,
  MaterialFormData,
  CampoFormulario,
} from "@repo/shared/types";
{
  /**
    id             Int               
  nombre         String
  descripcion    String
  precio         Int
  proveedor      String
  stockActual Int?
  unidadMedida String? // Ej: kg, m2, litros
  serviciosTarea Servicios_Tarea[]
  st_material ST_Material[]
}
  */
}

const campos: CampoFormulario[] = [
  { nombre: "nombre", etiqueta: "Nombre del material" },
  { nombre: "descripcion", etiqueta: "Descripción", tipo: "text" },
  { nombre: "precio", etiqueta: "Precio", tipo: "number" },
  { nombre: "proveedor", etiqueta: "Proveedor", tipo: "text" },
  { nombre: "stockActual", etiqueta: "Stock Actual", tipo: "number" },
  {
    nombre: "unidadMedida",
    etiqueta: "Unidad de Medida",
    tipo: "select",
    opciones: [
      { value: "kg", label: "Kilogramos" },
      { value: "m2", label: "Metros Cuadrados" },
      { value: "litros", label: "Litros" },
    ],
  },
];

export default function VerEditarmaterialPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const modoEdicion = searchParams.get("edit") === "true";

  const { loading: permisosLoading, can } = usePermisos();
  const puedeEditar = can("materiales", "editar");

  const [valores, setValores] = useState<MaterialFormData>({
    nombre: "",
    descripcion: "",
    precio: "",
    proveedor: "",
    stockActual: "",
    unidadMedida: "",
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
          `${process.env.NEXT_PUBLIC_API_URL}/materiales/${id}`,
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

        const data: Material = await res.json().catch(() => ({}));
        setValores({
          nombre: data?.nombre ?? "",
          descripcion: data?.descripcion ?? "",
          precio: data?.precio ?? "",
          proveedor: data?.proveedor ?? "",
          stockActual: data?.stockActual ?? "",
          unidadMedida: data?.unidadMedida ?? "",
        });
      } catch (err) {
        console.error("Error al obtener material:", err);
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
        `${process.env.NEXT_PUBLIC_API_URL}/materiales/${id}`,
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

      alert("material actualizado");
      router.push("/obras/materiales");
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Error al actualizar");
    }
  };

  if (cargando) return <p>Cargando material...</p>;

  return (
    <RequirePermiso modulo="materiales" accion="ver">
      <FormularioTabla
        titulo={modoEdicion ? "Editar material" : "Detalle del material"}
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

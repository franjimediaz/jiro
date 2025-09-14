"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import FormularioTabla from "../../../components/FormularioTabla";
import { RequirePermiso } from "../../../lib/permisos";

const campos = [
  { nombre: "nombre", etiqueta: "Nombre del Estado" },
  { nombre: "color", etiqueta: "Color", tipo: "color" },
  { nombre: "icono", etiqueta: "Icono", tipo: "icono" },
  {
    nombre: "preview",
    etiqueta: "Vista previa",
    tipo: "previsualizacion",
  },
];

export default function VerEditarEstado() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const modoEdicion = searchParams.get("edit") === "true";
  const [valores, setValores] = useState({
    nombre: "",
    color: "",
    icono: "",
  });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/estados/${id}`,
          {
            credentials: "include",
          }
        );

        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (res.status === 403) {
          router.replace("/403");
          return;
        }
        const data = await res.json();
        if (!cancelado) {
          setValores({
            nombre: data?.nombre ?? "",
            color: data?.color ?? "",
            icono: data?.icono ?? "",
          });
          setCargando(false);
        }
      } catch (err) {
        console.error("Error al obtener Estado:", err);
        if (!cancelado) setCargando(false);
      }
    };

    cargar();
    return () => {
      cancelado = true;
    };
  }, [id, router]);

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    try {
      setGuardando(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/estados/${id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(valores),
        }
      );

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
        throw new Error(data?.error || "Error al actualizar");
      }

      alert("Estado actualizado");
      router.push("/system/estados");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <p>Cargando Estado...</p>;

  // Requiere 'ver' para ver, y 'editar' cuando entra en modo edición
  const accionNecesaria = modoEdicion ? "editar" : "ver";

  return (
    <RequirePermiso modulo="estados" accion={accionNecesaria} fallback={null}>
      <FormularioTabla
        titulo={modoEdicion ? "Editar Estado" : "Detalle del Estado"}
        campos={campos}
        valores={valores}
        onChange={modoEdicion ? handleChange : undefined}
        onSubmit={modoEdicion && !guardando ? handleSubmit : undefined}
        botonTexto={
          modoEdicion
            ? guardando
              ? "Guardando..."
              : "Guardar cambios"
            : undefined
        }
        soloLectura={!modoEdicion}
      />
    </RequirePermiso>
  );
}

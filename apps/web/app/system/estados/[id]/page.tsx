"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import FormularioTabla from "../../../components/FormularioTabla";

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
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const modoEdicion = searchParams.get("edit") === "true";
  const [valores, setValores] = useState({
    nombre: "",
    color: "",
    icono: "",
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/estados/${id}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setValores(data);
        setCargando(false);
      })
      .catch((err) => {
        console.error("Error al obtener Estado:", err);
        setCargando(false);
      });
  }, [id]);

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/estados/${id}`,
      {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valores),
      }
    );

    if (res.ok) {
      alert("Estado actualizado");
      router.push("/obras/Estados");
    } else {
      alert("Error al actualizar");
    }
  };

  if (cargando) return <p>Cargando Estado...</p>;

  return (
    <>
      <FormularioTabla
        titulo={modoEdicion ? "Editar Estado" : "Detalle del Estado"}
        campos={campos}
        valores={valores}
        onChange={modoEdicion ? handleChange : undefined}
        onSubmit={modoEdicion ? handleSubmit : undefined}
        botonTexto="Guardar cambios"
        soloLectura={!modoEdicion}
      />
    </>
  );
}

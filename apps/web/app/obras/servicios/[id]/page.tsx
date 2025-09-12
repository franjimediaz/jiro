"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import FormularioTabla from "../../../components/FormularioTabla";

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

export default function VerEditarServicio() {
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
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/Servicios/${id}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setValores(data);
        setCargando(false);
      })
      .catch((err) => {
        console.error("Error al obtener Servicio:", err);
        setCargando(false);
      });
  }, [id]);

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/servicios/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valores),
        credentials: "include",
      }
    );

    if (res.ok) {
      alert("Servicio actualizado");
      router.push("/obras/servicios");
    } else {
      alert("Error al actualizar");
    }
  };

  if (cargando) return <p>Cargando Servicio...</p>;

  return (
    <>
      <FormularioTabla
        titulo={modoEdicion ? "Editar Servicio" : "Detalle del Servicio"}
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

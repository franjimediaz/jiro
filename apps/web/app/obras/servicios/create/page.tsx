"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormularioTabla from "../../../components/FormularioTabla";

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

const CrearServicio = () => {
  const router = useRouter();
  const [valores, setValores] = useState({
    nombre: "",
    color: "",
    icono: "",
  });

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/servicios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valores),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Error al crear el servicio");

      router.back(); // o router.push('/servicios') si tienes listado
    } catch (error) {
      console.error("Error al crear servicio:", error);
    }
  };

  return (
    <FormularioTabla
      titulo="Crear servicio"
      campos={campos}
      valores={valores}
      onChange={handleChange}
      onSubmit={handleSubmit}
      botonTexto="Crear servicio"
    />
  );
};

export default CrearServicio;

"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { FormularioTabla } from "@repo/ui";

const campos = [
  { nombre: "nombre", etiqueta: "Nombre" },
  { nombre: "apellido", etiqueta: "Apellido" },
  { nombre: "direccion", etiqueta: "Dirección" },
  { nombre: "email", etiqueta: "Email" },
  { nombre: "telefono", etiqueta: "Teléfono" },
  { nombre: "dni", etiqueta: "DNI" },
];

export default function VerEditarCliente() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const modoEdicion = searchParams.get("edit") === "true";
  const [valores, setValores] = useState({
    nombre: "",
    apellido: "",
    direccion: "",
    email: "",
    telefono: "",
    dni: "",
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/clientes/${id}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setValores(data);
        setCargando(false);
      })
      .catch((err) => {
        console.error("Error al obtener cliente:", err);
        setCargando(false);
      });
  }, [id]);

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/clientes/${id}`,
      {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valores),
      }
    );

    if (res.ok) {
      alert("Cliente actualizado");
      router.push("/clientes");
    } else {
      alert("Error al actualizar");
    }
  };

  if (cargando) return <p>Cargando cliente...</p>;

  return (
    <FormularioTabla
      titulo={modoEdicion ? "Editar Cliente" : "Detalle del Cliente"}
      campos={campos}
      valores={valores}
      onChange={modoEdicion ? handleChange : undefined}
      onSubmit={modoEdicion ? handleSubmit : undefined}
      botonTexto="Guardar cambios"
      soloLectura={!modoEdicion}
    />
  );
}

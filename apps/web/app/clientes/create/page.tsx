"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormularioTabla } from "@repo/ui";

const campos = [
  { nombre: "nombre", etiqueta: "Nombre" },
  { nombre: "apellido", etiqueta: "Apellido" },
  { nombre: "direccion", etiqueta: "Dirección" },
  { nombre: "email", etiqueta: "Email" },
  { nombre: "telefono", etiqueta: "Teléfono" },
  { nombre: "dni", etiqueta: "DNI" },
];

export default function NuevaClientes() {
  const router = useRouter();

  const [valores, setValores] = useState({
    nombre: "",
    apellido: "",
    direccion: "",
    email: "",
    telefono: "",
    dni: "",
  });

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    console.log("Enviando cliente:", valores);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clientes`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(valores),
    });

    const data = await res.json();
    console.log("Respuesta del backend:", data);

    if (res.ok) {
      alert("Cliente creado correctamente");
      router.push("/clientes");
    } else {
      alert(
        `❌ Error al crear cliente: ${data.error}\n🧾 Detalle: ${data.detalle || "No disponible"}`
      );
    }
  };

  return (
    <FormularioTabla
      titulo="Crear Cliente"
      campos={campos}
      valores={valores}
      onChange={handleChange}
      onSubmit={handleSubmit}
      botonTexto="Crear"
    />
  );
}

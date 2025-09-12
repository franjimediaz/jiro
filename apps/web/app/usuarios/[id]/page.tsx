"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import FormularioTabla from "../../components/FormularioTabla";

const campos = [
  { nombre: "idUsuario", etiqueta: "Id Usuario" },
  { nombre: "nombre", etiqueta: "Nombre" },
  { nombre: "apellido", etiqueta: "Apellido" },
  { nombre: "email", etiqueta: "Email" },
  { nombre: "password", etiqueta: "Contraseña", tipo: "password" },
  { nombre: "telefono", etiqueta: "Teléfono" },
  {
    nombre: "rolId",
    etiqueta: "Rol",
    tipo: "selectorTabla",
    tabla: "Roles",
    campoLabel: "nombre",
    campoValue: "id",
  },
  { nombre: "activo", etiqueta: "Activo", tipo: "checkbox" },
];

export default function VerEditarUsuario() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const modoEdicion = searchParams.get("edit") === "true";
  const [valores, setValores] = useState({
    nombre: "",
    idUsuario: "",
    apellido: "",
    email: "",
    password: "",
    telefono: "",
    rol: "",
    activo: "",
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/${id}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setValores(data);
        setCargando(false);
        console.log(data);
      })
      .catch((err) => {
        console.error("Error al obtener Usuario:", err);

        setCargando(false);
      });
  }, [id]);

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/Usuarios/${id}`,
      {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valores),
      }
    );

    if (res.ok) {
      alert("Usuario actualizado");
      router.push("/usuarios");
    } else {
      alert("Error al actualizar");
    }
  };

  if (cargando) return <p>Cargando Usuario...</p>;

  return (
    <>
      <FormularioTabla
        titulo={modoEdicion ? "Editar Usuario" : "Detalle del Usuario"}
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

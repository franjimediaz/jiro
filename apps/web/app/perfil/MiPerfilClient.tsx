"use client";
import { useState } from "react";
import FormularioTabla from "../components/FormularioTabla";

type Perfil = {
  idUsuario: number;
  email: string;
  nombre?: string;
  apellidos?: string;
  rol?: string;
  directorioEmpleado?: {
    telefono?: string;
    puesto?: string;
    tipo?: "INTERNO" | "EXTERNO";
    avatarUrl?: string;
    ubicacion?: string;
    extension?: string;
  } | null;
};

const campos = [
  { nombre: "email", etiqueta: "Emaill", readOnly: true },
  { nombre: "nombre", etiqueta: "Nombre" },
  { nombre: "apellidos", etiqueta: "Apellidos" },
  { nombre: "rol", etiqueta: "Rol", readOnly: true },
  { nombre: "telefono", etiqueta: "Teléfono" },
  { nombre: "puesto", etiqueta: "Puesto" },
  {
    nombre: "tipo",
    etiqueta: "Tipo",
    tipo: "select",
    opciones: [
      { label: "Interno", value: "INTERNO" },
      { label: "Externo", value: "EXTERNO" },
    ],
  },
  { nombre: "ubicacion", etiqueta: "Ubicación" },
  { nombre: "extension", etiqueta: "Extensión" },
  { nombre: "avatarUrl", etiqueta: "Avatar (URL)" },
];

export default function MiPerfilClient({
  perfilInicial,
}: {
  perfilInicial: Perfil;
}) {
  const [editando, setEditando] = useState(false);
  const [valores, setValores] = useState<any>({
    email: perfilInicial.email || "",
    nombre: perfilInicial.nombre || "",
    apellidos: perfilInicial.apellidos || "",
    rol: perfilInicial.rol || "",
    telefono: perfilInicial.directorioEmpleado?.telefono || "",
    puesto: perfilInicial.directorioEmpleado?.puesto || "",
    tipo: perfilInicial.directorioEmpleado?.tipo || "INTERNO",
    ubicacion: perfilInicial.directorioEmpleado?.ubicacion || "",
    extension: perfilInicial.directorioEmpleado?.extension || "",
    avatarUrl: perfilInicial.directorioEmpleado?.avatarUrl || "",
  });

  const handleChange = (nombre: string, valor: any) =>
    setValores((p: any) => ({ ...p, [nombre]: valor }));

  const handleSubmit = async () => {
    const payload = {
      nombre: valores.nombre,
      apellidos: valores.apellidos,
      telefono: valores.telefono,
      puesto: valores.puesto,
      tipo: valores.tipo,
      ubicacion: valores.ubicacion,
      extension: valores.extension,
      avatarUrl: valores.avatarUrl,
    };
    const res = await fetch(`/api/me`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      alert("Perfil actualizado");
      setEditando(false);
    } else {
      alert("Error al actualizar perfil");
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 12 }}>Mi Perfil</h1>
      {!editando && valores.avatarUrl && (
        <img
          src={valores.avatarUrl}
          alt="Avatar"
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            objectFit: "cover",
            marginBottom: 16,
          }}
        />
      )}
      <FormularioTabla
        titulo={editando ? "Editar perfil" : "Perfil"}
        campos={campos}
        valores={valores}
        onChange={editando ? handleChange : undefined}
        onSubmit={editando ? handleSubmit : undefined}
        botonTexto="Guardar"
        soloLectura={!editando}
      />
    </div>
  );
}

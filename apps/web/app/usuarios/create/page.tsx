"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormularioTabla from "../../components/FormularioTabla";
import { RequirePermiso } from "../../lib/permisos";

type UsuarioForm = {
  idUsuario: string;
  nombre: string;
  apellido: string;
  email: string;
  password: string; // solo para crear
  telefono: string;
  rolId: number | "";
  activo: boolean;
};

const campos = [
  { nombre: "idUsuario", etiqueta: "ID Usuario" },
  { nombre: "nombre", etiqueta: "Nombre" },
  { nombre: "apellido", etiqueta: "Apellido" },
  { nombre: "email", etiqueta: "Email" },
  { nombre: "password", etiqueta: "Contraseña", tipo: "password" },
  { nombre: "telefono", etiqueta: "Teléfono" },
  {
    nombre: "rolId",
    etiqueta: "Rol",
    tipo: "selectorTabla",
    tabla: "roles", // ← debe corresponderse con tu endpoint de tabla
    campoLabel: "nombre",
    campoValue: "id",
  },
  { nombre: "activo", etiqueta: "Activo", tipo: "checkbox" },
];

export default function CrearUsuario() {
  const router = useRouter();

  const [valores, setValores] = useState<UsuarioForm>({
    idUsuario: "",
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    telefono: "",
    rolId: "",
    activo: true,
  });

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    // Construimos payload limpio y con tipos correctos
    const payload: any = {
      idUsuario: valores.idUsuario?.trim(),
      nombre: valores.nombre?.trim(),
      apellido: valores.apellido?.trim(),
      email: valores.email?.trim(),
      telefono: valores.telefono?.trim(),
      activo: !!valores.activo,
    };

    if (valores.rolId !== "") payload.rolId = Number(valores.rolId);
    if (valores.password && valores.password.trim() !== "") {
      payload.password = valores.password; // el backend debe hashearla
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        if (typeof window !== "undefined") window.location.href = "/login";
        return;
      }
      if (res.status === 403) {
        router.replace("/403");
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        alert("Usuario creado correctamente");
        router.push("/usuarios");
      } else {
        const msg =
          (data && (data.error || data.message || data.detalle)) ||
          "Error desconocido";
        alert("Error al crear el usuario: " + msg);
      }
    } catch (err) {
      console.error("Error al crear usuario:", err);
      alert("No se pudo crear el usuario. Revisa la consola.");
    }
  };

  return (
    <RequirePermiso
      modulo="usuarios"
      accion="crear"
      fallback={<p>Cargando…</p>}
    >
      <FormularioTabla
        titulo="Crear Usuario"
        campos={campos}
        valores={valores}
        onChange={handleChange}
        onSubmit={handleSubmit}
        botonTexto="Crear"
      />
    </RequirePermiso>
  );
}

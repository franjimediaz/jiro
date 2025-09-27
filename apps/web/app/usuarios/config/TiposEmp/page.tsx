"use client";

import { useEffect, useState } from "react";
import { TablaListado } from "@repo/ui";
import styles from "./Usuarios.module.css";
import { useRouter } from "next/navigation";
import { RequirePermiso, usePermisos } from "../../../lib/permisos";

type Usuario = {
  id: number;
  nombre: string;
  apellido?: string;
  idUsuario?: string;
  email?: string;
  activo?: boolean;
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { can } = usePermisos();

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios`, {
          credentials: "include",
        });

        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (res.status === 403) {
          router.replace("/403");
          return;
        }

        const data = await res.json();
        setUsuarios(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error al obtener usuarios:", err);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [router]);

  const handleEliminar = (usuario: Usuario) => {
    if (!can("usuarios", "eliminar")) return;
    if (confirm(`¿Eliminar usuario "${usuario.nombre}"?`)) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/${usuario.id}`, {
        method: "DELETE",
        credentials: "include",
      })
        .then((res) => {
          if (!res.ok) throw new Error("Error al eliminar");
          setUsuarios((prev) => prev.filter((o) => o.id !== usuario.id));
          alert("Usuario eliminado");
        })
        .catch(() => alert("Error al eliminar"));
    }
  };

  const columnas = [
    { clave: "nombre", encabezado: "Nombre" },
    { clave: "apellido", encabezado: "Apellido" },
    { clave: "idUsuario", encabezado: "ID Usuario" },
    { clave: "activo", encabezado: "Activo", tipo: "checkbox" as const },
  ];

  const exportC = [
    { clave: "id", encabezado: "ID" },
    { clave: "nombre", encabezado: "Nombre" },
    { clave: "apellido", encabezado: "Apellido" },
    { clave: "idUsuario", encabezado: "ID Usuario" },
    { clave: "email", encabezado: "Email" },
    { clave: "telefono", encabezado: "Teléfono" },
    { clave: "rol", encabezado: "Rol" },
    { clave: "activo", encabezado: "Activo" },
  ];

  return (
    <RequirePermiso modulo="usuarios" accion="ver" fallback={null}>
      <main>
        <div className={styles.usuariosContainer}>
          <div className={styles.header}>
            <h1>Usuarios</h1>

            {can("usuarios", "crear") && (
              <button
                className={styles.botonCrear}
                onClick={() => router.push("/usuarios/create")}
              >
                + Crear usuario
              </button>
            )}
          </div>

          {loading ? (
            <p>Cargando usuarios...</p>
          ) : (
            <TablaListado
              titulo=""
              columnas={columnas}
              datos={usuarios}
              onVer={(u: Usuario) => router.push(`/usuarios/${u.id}`)}
              onEditar={
                can("usuarios", "editar")
                  ? (u: Usuario) => router.push(`/usuarios/${u.id}?edit=true`)
                  : undefined
              }
              onEliminar={
                can("usuarios", "eliminar")
                  ? (u: Usuario) => handleEliminar(u)
                  : undefined
              }
              registrosPorPagina={10}
              exportC={exportC}
              mostrarImportar={true}
              importUrl={`${process.env.NEXT_PUBLIC_API_URL}/usuarios`}
              onImport={async () => {
                const res = await fetch(
                  `${process.env.NEXT_PUBLIC_API_URL}/usuarios`,
                  { credentials: "include" }
                );
                const nuevosDatos = await res.json();
                setUsuarios(Array.isArray(nuevosDatos) ? nuevosDatos : []);
              }}
            />
          )}
        </div>
      </main>
    </RequirePermiso>
  );
}

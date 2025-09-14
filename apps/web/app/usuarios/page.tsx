"use client";

import { useEffect, useState } from "react";
import TablaListado from "../components/TablaListado";
import styles from "./Usuarios.module.css";
import { useRouter } from "next/navigation";
import type { Columna } from "../components/TablaListado";
import { RequirePermiso, usePermisos } from "../lib/permisos";

type Usuario = {
  id: number;
  nombre: string;
  apellido?: string;
  idUsuario?: string;
  email?: string;
  telefono?: string;
  activo: boolean;
  rolId?: number | null;
  rol?: { id: number; nombre: string } | null;
  // Campo derivado para mostrar/exportar
  rolNombre?: string;
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Permisos del usuario
  const { loading: permisosLoading, can } = usePermisos();

  // Traer datos SOLO si tiene permiso de 'ver'
  useEffect(() => {
    if (permisosLoading) return;

    if (!can("usuarios", "ver")) {
      setUsuarios([]);
      setLoading(false);
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        // Aseguramos rolNombre para tabla/export
        const normalizados: Usuario[] = Array.isArray(data)
          ? data.map((u: any) => ({
              ...u,
              rolNombre: u?.rol?.nombre ?? "Sin rol",
            }))
          : [];
        setUsuarios(normalizados);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener usuarios:", err);
        setLoading(false);
      });
  }, [permisosLoading, can]);

  const handleEliminar = (usuario: Usuario) => {
    if (!can("usuarios", "eliminar")) {
      alert("Sin permiso para eliminar");
      return;
    }

    if (confirm(`¿Eliminar usuario "${usuario.nombre}"?`)) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/${usuario.id}`, {
        method: "DELETE",
        credentials: "include",
      })
        .then(() => {
          setUsuarios((prev) => prev.filter((o) => o.id !== usuario.id));
          alert("Usuario eliminado");
        })
        .catch(() => alert("Error al eliminar"));
    }
  };

  const columnas: Columna[] = [
    { clave: "nombre", encabezado: "Nombre" },
    { clave: "apellido", encabezado: "Apellido" },
    { clave: "idUsuario", encabezado: "ID Usuario" },
    { clave: "rolNombre", encabezado: "Rol" },
    { clave: "activo", encabezado: "Activo", tipo: "checkbox" },
  ];

  // "usuarios" no tiene acción "exportar" en tu mapa → desactivamos exportación
  const exportC: Columna[] = []; // si quieres permitir exportar más adelante, añade can("usuarios","exportar") y define columnas

  // "usuarios" tampoco tiene "importar" → lo ligamos a can(...) para mantener coherencia
  const puedeImportar = can("usuarios", "importar"); // normalmente false

  return (
    <RequirePermiso modulo="usuarios" accion="ver">
      <main>
        <div className={styles.usuariosContainer}>
          <div className={styles.header}>
            <h1>Listado de usuarios</h1>

            {/* Botón crear solo si tiene permiso */}
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
              onVer={(u) =>
                can("usuarios", "ver") && router.push(`/usuarios/${u.id}`)
              }
              onEditar={(u) =>
                can("usuarios", "editar") &&
                router.push(`/usuarios/${u.id}?edit=true`)
              }
              onEliminar={handleEliminar}
              registrosPorPagina={10}
              exportC={exportC}
              mostrarImportar={puedeImportar}
              importUrl={`${process.env.NEXT_PUBLIC_API_URL}/usuarios`}
              onImport={async () => {
                if (!puedeImportar) return;
                const res = await fetch(
                  `${process.env.NEXT_PUBLIC_API_URL}/usuarios`,
                  {
                    credentials: "include",
                  }
                );
                const nuevosDatos = await res.json();
                const normalizados: Usuario[] = Array.isArray(nuevosDatos)
                  ? nuevosDatos.map((u: any) => ({
                      ...u,
                      rolNombre: u?.rol?.nombre ?? "Sin rol",
                    }))
                  : [];
                setUsuarios(normalizados);
              }}
            />
          )}
        </div>
      </main>
    </RequirePermiso>
  );
}

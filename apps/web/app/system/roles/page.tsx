"use client";

import { useEffect, useState } from "react";
import TablaListado from "../../components/TablaListado";
import styles from "./Roles.module.css";
import { useRouter } from "next/navigation";
import type { Columna } from "../../components/TablaListado";

type Rol = {
  id: number;
  nombre: string;
  direccion: string;
  fechaInicio: string;
  fechaFin: string;
  Rol: string;
};

export default function RolesPage() {
  const [Roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/Roles`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setRoles(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener Roles:", err);
        setLoading(false);
      });
  }, []);

  const handleEliminar = (Rol: any) => {
    if (confirm(`¿Eliminar Rol "${Rol.nombre}"?`)) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/roles/${Rol.id}`, {
        method: "DELETE",
        credentials: "include",
      })
        .then(() => {
          setRoles((prev) => prev.filter((o) => o.id !== Rol.id));
          alert("Rol eliminada");
        })
        .catch(() => alert("Error al eliminar"));
    }
  };

  const columnas: Columna[] = [
    { clave: "nombre", encabezado: "Nombre" },
    { clave: "nivel", encabezado: "Nivel" },
    { clave: "activo", encabezado: "Activo", tipo: "checkbox" },
  ];

  return (
    <main>
      <div className={styles.RolesContainer}>
        <div className={styles.header}>
          <h1>Listado de Roles</h1>
          <button
            className={styles.botonCrear}
            onClick={() => router.push("roles/create")}
          >
            + Crear Rol
          </button>
        </div>

        {loading ? (
          <p>Cargando Roles...</p>
        ) : (
          <TablaListado
            titulo=""
            columnas={columnas}
            datos={Roles}
            onVer={(Roles) => router.push(`/system/roles/${Roles.id}`)}
            onEditar={(Roles) =>
              router.push(`/system/roles/${Roles.id}?edit=true`)
            }
            onEliminar={handleEliminar}
          />
        )}
      </div>
    </main>
  );
}

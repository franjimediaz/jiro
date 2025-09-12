"use client";

import { useEffect, useState } from "react";
import TablaListado from "../components/TablaListado";
import styles from "./Usuarios.module.css"; // o donde tengas el CSS
import { useRouter } from "next/navigation";
import type { Columna } from "../components/TablaListado";

type usuario = {
  id: number;
  nombre: string;
  direccion: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
};

export default function usuariosPage() {
  const [usuarios, setusuarios] = useState<usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // ← Aquí

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setusuarios(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener usuarios:", err);
        setLoading(false);
      });
  }, []);

  const handleEliminar = (usuario: any) => {
    if (confirm(`¿Eliminar usuario "${usuario.nombre}"?`)) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/${usuario.id}`, {
        method: "DELETE",
        credentials: "include",
      })
        .then(() => {
          setusuarios((prev) => prev.filter((o) => o.id !== usuario.id));
          alert("usuario eliminada");
        })
        .catch(() => alert("Error al eliminar"));
    }
  };

  const columnas: Columna[] = [
    { clave: "nombre", encabezado: "Nombre" },
    { clave: "apellido", encabezado: "Apellido" },
    { clave: "idUsuario", encabezado: "ID Usuario" },
    { clave: "activo", encabezado: "Activo", tipo: "checkbox" },
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
    <main>
      <div className={styles.usuariosContainer}>
        <div className={styles.header}>
          <h1>Listado de usuarios</h1>
          <button
            className={styles.botonCrear}
            onClick={() => router.push("/usuarios/create")}
          >
            + Crear usuario
          </button>
        </div>

        {loading ? (
          <p>Cargando usuarios...</p>
        ) : (
          <TablaListado
            titulo=""
            columnas={columnas}
            datos={usuarios}
            onVer={(usuarios) => router.push(`/usuarios/${usuarios.id}`)}
            onEditar={(usuarios) =>
              router.push(`/usuarios/${usuarios.id}?edit=true`)
            }
            onEliminar={handleEliminar}
            registrosPorPagina={10}
            exportC={exportC}
            mostrarImportar={true}
            importUrl={`${process.env.NEXT_PUBLIC_API_URL}/usuarios`}
            onImport={async () => {
              const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/usuarios`,
                {
                  credentials: "include",
                }
              );
              const nuevosDatos = await res.json();
              setusuarios(nuevosDatos);
            }}
          />
        )}
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import TablaListado from "../../components/TablaListado";
import styles from "./Directorio.module.css"; // o donde tengas el CSS
import { useRouter } from "next/navigation";

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
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios`)
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
      })
        .then(() => {
          setusuarios((prev) => prev.filter((o) => o.id !== usuario.id));
          alert("usuario eliminada");
        })
        .catch(() => alert("Error al eliminar"));
    }
  };

  const columnas = [
    { clave: "nombre", encabezado: "Nombre" },
    { clave: "direccion", encabezado: "Dirección" },
    { clave: "estado", encabezado: "Estado" },
    {
      clave: "fechaInicio",
      encabezado: "Inicio",
      render: (valor: string) => new Date(valor).toLocaleDateString(),
    },
    {
      clave: "fechaFin",
      encabezado: "Fin",
      render: (valor: string) => new Date(valor).toLocaleDateString(),
    },
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
          />
        )}
      </div>
    </main>
  );
}

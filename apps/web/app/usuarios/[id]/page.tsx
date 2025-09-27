"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { FormularioTabla, TablaListado } from "@repo/ui";
import { RequirePermiso, usePermisos } from "../../lib/permisos";

type UsuarioForm = {
  idUsuario: string;
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono: string;
  rolId: number | "";
  activo: boolean;
};
type Directorio = {
  id: number;
  nombre: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  estado?: boolean; // activo/inactivo
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
    tabla: "roles",
    campoLabel: "nombre",
    campoValue: "id",
  },
  { nombre: "activo", etiqueta: "Activo", tipo: "checkbox" },
];
const columnas = [
  { clave: "displayName", encabezado: "Nombre" },
  { clave: "email", encabezado: "Email" },
  {
    clave: "estado",
    encabezado: "Activo",
    tipo: "checkbox" as const,
    render: (valor: boolean) => (valor ? "Sí" : "No"),
  },
];

export default function VerEditarUsuario() {
  const { id } = useParams(); // ✅ hook DENTRO del componente
  const searchParams = useSearchParams(); // ✅
  const router = useRouter(); // ✅
  const [directorios, setDirectorios] = useState<Directorio[]>([]);
  const [loading, setLoading] = useState(true);
  const { loading: loadingPerms, can } = usePermisos();
  const puedeEliminar = can("directorios", "eliminar");

  const modoEdicion = searchParams.get("edit") === "true";

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
  const [cargando, setCargando] = useState(true);
  const [creandoDir, setCreandoDir] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "")}/usuarios/${id}`,
          { credentials: "include" }
        );

        if (res.status === 401) {
          if (typeof window !== "undefined") window.location.href = "/login";
          return;
        }
        if (res.status === 403) {
          router.replace("/403");
          return;
        }

        const data = await res.json();
        setValores({
          idUsuario: data?.idUsuario ?? "",
          nombre: data?.nombre ?? "",
          apellido: data?.apellido ?? "",
          email: data?.email ?? "",
          password: "",
          telefono: data?.telefono ?? "",
          rolId: typeof data?.rolId === "number" ? data.rolId : "",
          activo: Boolean(data?.activo),
        });
      } catch (err) {
        console.error("Error al obtener Usuario:", err);
      } finally {
        setCargando(false);
      }
    };

    if (id) cargar();
  }, [id, router]);
  useEffect(() => {
    // Espera permisos resueltos y un id válido
    if (loadingPerms) return;

    const puedeVer = can("directorios", "ver");
    if (!puedeVer) return;
    if (!id) return;

    const ctrl = new AbortController();

    const cargar = async () => {
      setLoading(true); // ✅ marca loading al iniciar

      try {
        const base = process.env.NEXT_PUBLIC_API_URL || "";
        const url = `${base.replace(/\/$/, "")}/directorios?usuarioId=${encodeURIComponent(String(id))}`;
        const res = await fetch(url, {
          credentials: "include",
          cache: "no-store",
          signal: ctrl.signal,
        });

        if (res.status === 401) {
          if (typeof window !== "undefined") window.location.href = "/login";
          return;
        }
        if (res.status === 404) {
          // si tu backend devolviera 404, deja lista vacía
          setDirectorios([]);
          return;
        }
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          console.error(
            "[GET directorios por usuario] status",
            res.status,
            txt
          );
          setDirectorios([]);
          return;
        }

        const data = await res.json();
        // ✅ fallback: si por cualquier motivo llega un objeto, lo envolvemos
        const arr = Array.isArray(data) ? data : data ? [data] : [];
        setDirectorios(arr);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Error al obtener directorios:", err?.message || err);
        }
      } finally {
        setLoading(false);
      }
    };

    cargar();
    return () => ctrl.abort();
  }, [loadingPerms, can, id]); // ✅ incluye `id`

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
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
      payload.password = valores.password;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "")}/usuarios/${id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

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
        alert("Usuario actualizado");
        router.push("/usuarios");
      } else {
        const msg =
          (data && (data.error || data.message || data.detalle)) ||
          "Error desconocido";
        alert("Error al actualizar: " + msg);
      }
    } catch (err) {
      console.error("Error al actualizar usuario:", err);
      alert("No se pudo actualizar el usuario. Revisa la consola.");
    }
  };
  const handleEliminarDirectorio = (registro: Directorio) => {
    if (!puedeEliminar) {
      alert("No tienes permisos para eliminar directorios.");
      return;
    }
    if (confirm(`¿Eliminar directorio "${registro.nombre}"?`)) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/directorios/${registro.id}`, {
        method: "DELETE",
        credentials: "include",
      })
        .then((res) => {
          if (!res.ok) throw new Error("Error al eliminar");
          setDirectorios((prev) => prev.filter((o) => o.id !== registro.id));
          alert("Directorio eliminado");
        })
        .catch(() => alert("Error al eliminar"));
    }
  };

  const crearDirectorio = async () => {
    if (!id) return;
    try {
      setCreandoDir(true);
      const url = `/api/usuarios/${id}/directorio`; // usa proxy Next (recomendado)
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/usuarios/${id}/directorio`
          : url,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        alert("Directorio creado con éxito");
        // Ajusta si tu ruta de detalle de directorio es otra
        router.push(`/usuarios/directorios/${data?.directorio?.id}`);
        return;
      }

      const msg = data?.error || JSON.stringify(data) || `HTTP ${res.status}`;
      alert(`No se pudo crear el directorio: ${msg}`);
    } catch (e: any) {
      console.error("crearDirectorio error:", e?.message || e);
      alert(
        `Error inesperado creando directorio: ${e?.message || "network/CORS"}`
      );
    } finally {
      setCreandoDir(false);
    }
  };

  if (cargando) return <p>Cargando Usuario...</p>;

  return (
    <div>
      <TablaListado
        titulo="Directorio Asociado"
        columnas={columnas}
        datos={directorios}
        onVer={(fila) => router.push(`/usuarios/directorios/${fila.id}`)}
        onEditar={(fila) =>
          router.push(`/usuarios/directorios/${fila.id}?edit=true`)
        }
        onEliminar={puedeEliminar ? handleEliminarDirectorio : undefined}
        registrosPorPagina={1}
        mostrarImportar={false}
      />
      <RequirePermiso modulo="directorios" accion="crear" fallback={null}>
        <button
          onClick={crearDirectorio}
          disabled={creandoDir}
          className="boton-flotante"
        >
          {creandoDir ? "Creando..." : "Crear directorio"}
        </button>
      </RequirePermiso>
      <RequirePermiso
        modulo="usuarios"
        accion={modoEdicion ? "editar" : "ver"}
        fallback={<p>Comprobando permisos…</p>}
      >
        <FormularioTabla
          titulo={modoEdicion ? "Editar Usuario" : "Detalle del Usuario"}
          campos={campos}
          valores={valores}
          onChange={modoEdicion ? handleChange : undefined}
          onSubmit={modoEdicion ? handleSubmit : undefined}
          botonTexto="Guardar cambios"
          soloLectura={!modoEdicion}
        />
      </RequirePermiso>
      {/* Botón arriba; no introduce hooks */}
    </div>
  );
}

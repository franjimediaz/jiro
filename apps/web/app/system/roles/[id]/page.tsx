"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import FormularioTabla from "../../../components/FormularioTabla";
import PermisosSelector from "../../../components/PermisosSelector";
import { RequirePermiso } from "../../../lib/permisos";
import { PermisosRol, ValoresFormularioRol } from "../../../../types/roles";

// ✅ Extender la interfaz para incluir ID
interface ValoresFormularioRolConId extends ValoresFormularioRol {
  id?: number;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

export default function VerEditarRol() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const modoEdicion = searchParams.get("edit") === "true";

  // ✅ Usar la interfaz extendida
  const [valores, setValores] = useState<ValoresFormularioRolConId>({
    nombre: "",
    descripcion: "",
    nivel: 1,
    activo: true,
    permisos: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Cargar datos del rol
  useEffect(() => {
    const cargarRol = async () => {
      try {
        setCargando(true);
        setError(null);

        // ✅ Validar ID antes de hacer la petición
        if (!id || Array.isArray(id)) {
          throw new Error("ID de rol inválido");
        }

        // ✅ Convertir a número para validar
        const rolId = parseInt(id as string, 10);
        if (Number.isNaN(rolId)) {
          throw new Error("El ID debe ser un número válido");
        }

        const res = await fetch(`${API_BASE}/roles/${rolId}`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (res.status === 401) {
          router.replace("/login");
          return;
        }

        if (!res.ok) {
          let errorMessage = `Error ${res.status}: ${res.statusText}`;
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            /* noop */
          }
          throw new Error(errorMessage);
        }

        const data = await res.json();

        // ✅ Parsear permisos (puede venir como string u objeto)
        let permisosParseados: PermisosRol = {};
        if (data.permisos) {
          try {
            permisosParseados =
              typeof data.permisos === "string"
                ? JSON.parse(data.permisos)
                : data.permisos;
          } catch {
            permisosParseados = {};
          }
        }

        setValores({
          id: data.id,
          nombre: data.nombre ?? "",
          descripcion: data.descripcion ?? "",
          nivel:
            typeof data.nivel === "number"
              ? data.nivel
              : Number(data.nivel) || 1,
          activo: Boolean(data.activo),
          permisos: permisosParseados,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Error desconocido al cargar el rol";
        setError(errorMessage);
      } finally {
        setCargando(false);
      }
    };

    if (id) {
      cargarRol();
    } else {
      setError("No se proporcionó un ID de rol válido");
      setCargando(false);
    }
  }, [id, router]);

  const secciones = [
    {
      titulo: "Información del Rol",
      descripcion: modoEdicion
        ? "Editar datos básicos del rol"
        : "Datos básicos del rol",
      expandible: true,
      expandidaPorDefecto: true,
      campos: [
        {
          nombre: "nombre",
          etiqueta: "Nombre del Rol",
          placeholder: "Ej: Administrador",
          requerido: true,
        },
        {
          nombre: "descripcion",
          etiqueta: "Descripción",
          placeholder: "Descripción del rol",
          tipo: "textarea",
        },
        {
          nombre: "nivel",
          etiqueta: "Nivel de Acceso",
          placeholder: "1-10",
          tipo: "number",
          min: 1,
          max: 10,
        },
        {
          nombre: "activo",
          etiqueta: "Rol Activo",
          tipo: "checkbox",
        },
      ],
    },
  ];

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
  };

  const handlePermisosChange = (nuevosPermisos: PermisosRol) => {
    setValores((prev) => ({ ...prev, permisos: nuevosPermisos }));
  };

  const handleSubmit = async () => {
    try {
      // ✅ Validaciones
      if (!valores.nombre.trim()) {
        alert("El nombre del rol es obligatorio");
        return;
      }

      const nivelNum = parseInt(String(valores.nivel || 1), 10);
      if (Number.isNaN(nivelNum) || nivelNum < 1 || nivelNum > 10) {
        alert("El nivel debe estar entre 1 y 10.");
        return;
      }

      // ✅ Verificar que tenga al menos un permiso
      const tienePermisos = Object.values(valores.permisos || {}).some(
        (moduloPermisos: any) =>
          Object.values(moduloPermisos || {}).some(Boolean)
      );

      if (!tienePermisos) {
        alert("Debe asignar al menos un permiso al rol");
        return;
      }

      // ✅ Preparar datos para enviar
      const datosRol = {
        nombre: valores.nombre.trim(),
        descripcion: valores.descripcion?.trim() || null,
        nivel: nivelNum,
        activo: !!valores.activo,
        permisos: JSON.stringify(valores.permisos),
      };

      const rolId = parseInt(id as string, 10);

      const res = await fetch(`${API_BASE}/roles/${rolId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosRol),
      });

      if (res.status === 401) {
        router.replace("/login");
        return;
      }

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Error al actualizar el rol");
      }

      alert("Rol actualizado correctamente");

      // ✅ Recargar datos o redirigir
      const redirigir = confirm("¿Desea volver a la lista de roles?");
      if (redirigir) {
        router.push("/system/roles");
      } else {
        router.push(`/system/roles/${id}`);
      }
    } catch (error) {
      console.error("❌ Error al actualizar rol:", error);
      alert(`Error: ${(error as Error).message}`);
    }
  };

  // ✅ Estados de carga y error
  if (cargando) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
        <h2>Cargando rol...</h2>
        <p style={{ color: "#666" }}>
          Obteniendo información del rol del servidor.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>❌</div>
        <h2>Error al cargar el rol</h2>
        <p style={{ color: "#dc3545", marginBottom: "20px" }}>{error}</p>
        <button
          onClick={() => router.push("/system/roles")}
          style={{
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Volver a la lista
        </button>
      </div>
    );
  }

  // ✅ Info sistema (solo vista)
  const InfoSistema = () =>
    !modoEdicion ? (
      <div
        style={{
          marginTop: 16,
          padding: 12,
          border: "1px solid #eee",
          borderRadius: 8,
          background: "#fafafa",
          fontSize: 14,
          lineHeight: 1.6,
        }}
      >
        <strong>ID:</strong> {valores.id ?? "—"}
        <br />
        <strong>Creado:</strong>{" "}
        {valores.createdAt ? new Date(valores.createdAt).toLocaleString() : "—"}
        <br />
        <strong>Actualizado:</strong>{" "}
        {valores.updatedAt ? new Date(valores.updatedAt).toLocaleString() : "—"}
      </div>
    ) : null;

  return (
    <RequirePermiso
      modulo="roles"
      accion={modoEdicion ? "editar" : "ver"}
      fallback={null}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        {/* Título */}
        <h1 style={{ margin: 0 }}>
          {modoEdicion ? "Editar Rol" : "Detalle del Rol"}:{" "}
          {valores.nombre || "—"}
        </h1>

        {/* Formulario básico */}
        <FormularioTabla
          titulo=""
          secciones={secciones}
          valores={valores}
          onChange={modoEdicion ? handleChange : undefined}
          onSubmit={modoEdicion ? handleSubmit : undefined}
          botonTexto="Guardar Cambios"
          soloLectura={!modoEdicion}
        />

        <InfoSistema />

        {/* Selector de permisos */}
        <div style={{ marginTop: "24px" }}>
          <PermisosSelector
            permisos={valores.permisos}
            onChange={handlePermisosChange}
            readonly={!modoEdicion}
            showStats={true}
            showTemplates={modoEdicion}
          />
        </div>

        {/* Vista previa JSON (solo en desarrollo y modo edición) */}
        {process.env.NODE_ENV === "development" && modoEdicion && (
          <details style={{ marginTop: "24px" }}>
            <summary
              style={{
                cursor: "pointer",
                padding: "8px",
                backgroundColor: "#f8f9fa",
                borderRadius: "4px",
              }}
            >
              🔍 Vista previa JSON de Permisos (Dev)
            </summary>
            <pre
              style={{
                fontSize: "11px",
                overflow: "auto",
                maxHeight: "300px",
                backgroundColor: "#f8f9fa",
                padding: "12px",
                borderRadius: "4px",
                border: "1px solid #ddd",
                marginTop: "8px",
              }}
            >
              {JSON.stringify(valores.permisos, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </RequirePermiso>
  );
}

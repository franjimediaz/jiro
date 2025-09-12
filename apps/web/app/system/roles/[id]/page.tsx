"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import FormularioTabla from "../../../components/FormularioTabla";
import PermisosSelector from "../../../components/PermisosSelector";
import { PermisosRol, ValoresFormularioRol } from "../../../../types/roles";

// ✅ Extender la interfaz para incluir ID
interface ValoresFormularioRolConId extends ValoresFormularioRol {
  id?: number;
}

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
        const rolId = parseInt(id);
        if (isNaN(rolId)) {
          throw new Error("El ID debe ser un número válido");
        }

        console.log(`🔍 Cargando rol con ID: ${rolId} (número)`);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/roles/${rolId}`, // ✅ Usar número
          {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log(
          `📡 Respuesta del servidor: ${res.status} ${res.statusText}`
        );

        if (!res.ok) {
          let errorMessage = `Error ${res.status}: ${res.statusText}`;

          try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorMessage;
            console.error("❌ Error del servidor:", errorData);
          } catch (e) {
            console.error("❌ Error al parsear respuesta de error:", e);
          }

          throw new Error(errorMessage);
        }

        const data = await res.json();
        console.log("✅ Datos del rol recibidos:", {
          id: data.id,
          nombre: data.nombre,
          tienePermisos: !!data.permisos,
        });

        // ✅ Parsear permisos de JSON string a objeto
        let permisosParseados = {};
        if (data.permisos) {
          try {
            permisosParseados = JSON.parse(data.permisos);
            console.log("✅ Permisos parseados correctamente");
          } catch (e) {
            console.warn(
              "⚠️ Error al parsear permisos, usando objeto vacío:",
              e
            );
            permisosParseados = {};
          }
        } else {
          console.log("ℹ️ El rol no tiene permisos definidos");
        }

        // ✅ Incluir el ID en el estado (como número)
        setValores({
          ...data,
          id: data.id, // ✅ Mantener como número
          permisos: permisosParseados,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        });

        console.log("✅ Estado actualizado correctamente");
      } catch (err) {
        console.error("❌ Error al obtener rol:", err);
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
  }, [id]);

  const campos = [
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
    // ✅ Información adicional solo en modo vista
    ...(!modoEdicion
      ? [
          {
            titulo: "Información del Sistema",
            descripcion: "Datos automáticos del sistema",
            expandible: true,
            expandidaPorDefecto: false,
            campos: [
              {
                nombre: "id",
                etiqueta: "ID",
                tipo: "text",
                readonly: true,
              },
              {
                nombre: "createdAt",
                etiqueta: "Fecha de Creación",
                tipo: "datetime-local",
                readonly: true,
                valor: valores.createdAt?.toISOString().slice(0, 16), // ✅ Formatear para datetime-local
              },
              {
                nombre: "updatedAt",
                etiqueta: "Última Actualización",
                tipo: "datetime-local",
                readonly: true,
                valor: valores.updatedAt?.toISOString().slice(0, 16), // ✅ Formatear para datetime-local
              },
            ],
          },
        ]
      : []),
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

      // ✅ Verificar que tenga al menos un permiso
      const tienePermisos = Object.values(valores.permisos).some(
        (moduloPermisos: any) => Object.values(moduloPermisos).some(Boolean)
      );

      if (!tienePermisos) {
        alert("Debe asignar al menos un permiso al rol");
        return;
      }

      // ✅ Preparar datos para enviar (sin incluir ID)
      const datosRol = {
        nombre: valores.nombre.trim(),
        descripcion: valores.descripcion?.trim() || null,
        nivel: parseInt(valores.nivel.toString()) || 1,
        activo: valores.activo,
        permisos: JSON.stringify(valores.permisos), // ✅ Convertir a JSON string
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/roles/${id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datosRol),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al actualizar el rol");
      }

      alert("Rol actualizado correctamente");

      // ✅ Recargar datos o redirigir
      const redirigir = confirm("¿Desea volver a la lista de roles?");
      if (redirigir) {
        router.push("/system/roles");
      } else {
        // Recargar la página en modo vista
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

  // ✅ Calcular estadísticas de permisos para el header
  const calcularEstadisticas = () => {
    let totalPermisos = 0;
    let permisosActivos = 0;

    Object.values(valores.permisos).forEach((moduloPermisos: any) => {
      const permisosArray = Object.values(moduloPermisos);
      totalPermisos += permisosArray.length;
      permisosActivos += permisosArray.filter(Boolean).length;
    });

    return { totalPermisos, permisosActivos };
  };

  const stats = calcularEstadisticas();

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      {/* ✅ Formulario básico */}
      <h1 style={{ margin: 0 }}>
        {modoEdicion ? "Editar Rol" : "Detalle del Rol"}:{" "}
        {valores.nombre || "Cargando..."}
      </h1>
      <FormularioTabla
        titulo=""
        secciones={campos}
        valores={valores}
        onChange={modoEdicion ? handleChange : undefined}
        onSubmit={modoEdicion ? handleSubmit : undefined}
        botonTexto="Guardar Cambios"
        soloLectura={!modoEdicion}
      />

      {/* ✅ Selector de permisos */}
      <div style={{ marginTop: "24px" }}>
        <PermisosSelector
          permisos={valores.permisos}
          onChange={handlePermisosChange}
          readonly={!modoEdicion} // ✅ Solo lectura si no está en modo edición
          showStats={true}
          showTemplates={modoEdicion} // ✅ Solo mostrar plantillas en modo edición
        />
      </div>

      {/* ✅ Vista previa JSON (solo en desarrollo y modo edición) */}
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
  );
}

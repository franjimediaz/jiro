"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FormularioTabla from "../../../components/FormularioTabla";
import PermisosSelector from "../../../components/PermisosSelector";
import { generarEstructuraPermisosInicial } from "../../modulos/modulosService";
import { PermisosRol, ValoresFormularioRol } from "../../../../types/roles";
import { RequirePermiso } from "../../../lib/permisos";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

export default function CrearRol() {
  const router = useRouter();

  const [valores, setValores] = useState<ValoresFormularioRol>({
    nombre: "",
    descripcion: "",
    nivel: 1,
    activo: true,
    permisos: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [cargandoPermisos, setCargandoPermisos] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Inicializar permisos con la jerarquía de módulos
  useEffect(() => {
    const inicializar = async () => {
      try {
        const permisosIniciales: PermisosRol =
          await generarEstructuraPermisosInicial();
        setValores((prev) => ({ ...prev, permisos: permisosIniciales }));
      } catch (err) {
        console.error("Error al inicializar permisos:", err);
      } finally {
        setCargandoPermisos(false);
      }
    };
    inicializar();
  }, []);

  const secciones = [
    {
      titulo: "Información Básica",
      descripcion: "Datos básicos del rol",
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
    if (guardando) return;

    try {
      // Validaciones mínimas
      if (!valores.nombre.trim()) {
        alert("El nombre del rol es obligatorio");
        return;
      }

      const nivelNum = parseInt(valores.nivel as unknown as string, 10);
      if (Number.isNaN(nivelNum) || nivelNum < 1 || nivelNum > 10) {
        alert("El nivel debe estar entre 1 y 10.");
        return;
      }

      const tienePermisos = Object.values(valores.permisos || {}).some(
        (mod: any) => Object.values(mod || {}).some(Boolean)
      );
      if (!tienePermisos) {
        alert("Debe asignar al menos un permiso al rol");
        return;
      }

      setGuardando(true);

      const payload = {
        nombre: valores.nombre.trim(),
        descripcion: valores.descripcion?.trim() || null,
        nivel: nivelNum,
        activo: !!valores.activo,
        permisos: JSON.stringify(valores.permisos),
      };

      const res = await fetch(`${API_BASE}/roles`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        router.replace("/login");
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al crear el rol");
      }

      alert("Rol creado correctamente");
      router.push("/system/roles");
    } catch (error) {
      console.error("❌ Error al crear rol:", error);
      alert(`Error: ${(error as Error).message}`);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <RequirePermiso modulo="roles" accion="crear" fallback={null}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        {/* Título */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ margin: "0 0 8px 0" }}>Crear Nuevo Rol</h1>
          <p style={{ margin: 0, color: "#666" }}>
            Configure los datos básicos y permisos para el nuevo rol del
            sistema.
          </p>
        </div>

        {/* Formulario básico */}
        <FormularioTabla
          titulo=""
          secciones={secciones}
          valores={valores}
          onChange={handleChange}
          onSubmit={handleSubmit}
          botonTexto={guardando ? "Guardando..." : "Crear Rol"}
        />

        {/* Selector de permisos */}
        <div style={{ marginTop: "24px" }}>
          {cargandoPermisos ? (
            <p>Cargando permisos...</p>
          ) : (
            <PermisosSelector
              permisos={valores.permisos}
              onChange={handlePermisosChange}
              showStats={true}
              showTemplates={true}
            />
          )}
        </div>

        {/* Vista previa JSON (solo desarrollo) */}
        {process.env.NODE_ENV === "development" && (
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

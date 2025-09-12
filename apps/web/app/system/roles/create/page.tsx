"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FormularioTabla from "../../../components/FormularioTabla"; // ✅ Ruta corregida
import PermisosSelector from "../../../components/PermisosSelector"; // ✅ Ruta corregida
import { generarEstructuraPermisosInicial } from "../../modulos/modulosService";
import { PermisosRol, ValoresFormularioRol } from "../../../../types/roles";

const CrearRol = () => {
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

  // ✅ Inicializar permisos
  useEffect(() => {
    const inicializarPermisos = async () => {
      try {
        const permisosIniciales: PermisosRol =
          await generarEstructuraPermisosInicial();
        setValores((prev) => ({ ...prev, permisos: permisosIniciales }));
      } catch (error) {
        console.error("Error al inicializar permisos:", error);
      }
    };

    inicializarPermisos();
  }, []);

  const campos = [
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
    try {
      if (!valores.nombre.trim()) {
        alert("El nombre del rol es obligatorio");
        return;
      }

      const tienePermisos = Object.values(valores.permisos).some(
        (moduloPermisos: any) => Object.values(moduloPermisos).some(Boolean)
      );

      if (!tienePermisos) {
        alert("Debe asignar al menos un permiso al rol");
        return;
      }

      const datosRol = {
        nombre: valores.nombre.trim(),
        descripcion: valores.descripcion?.trim() || null,
        nivel: parseInt(valores.nivel.toString()) || 1,
        activo: valores.activo,
        permisos: JSON.stringify(valores.permisos),
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/roles`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosRol),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al crear el rol");
      }

      alert("Rol creado correctamente");
      router.push("/system/roles");
    } catch (error) {
      console.error("❌ Error al crear rol:", error);
      alert(`Error: ${(error as Error).message}`);
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      {/* ✅ Título */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ margin: "0 0 8px 0" }}>Crear Nuevo Rol</h1>
        <p style={{ margin: 0, color: "#666" }}>
          Configure los datos básicos y permisos para el nuevo rol del sistema.
        </p>
      </div>

      {/* ✅ Formulario básico */}
      <FormularioTabla
        titulo=""
        secciones={campos}
        valores={valores}
        onChange={handleChange}
        onSubmit={handleSubmit}
        botonTexto="Crear Rol"
      />

      {/* ✅ Selector de permisos */}
      <div style={{ marginTop: "24px" }}>
        <PermisosSelector
          permisos={valores.permisos}
          onChange={handlePermisosChange}
          showStats={true}
          showTemplates={true}
        />
      </div>

      {/* ✅ Vista previa JSON (solo desarrollo) */}
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
  );
};

export default CrearRol;

"use client";

import { useState, useEffect } from "react";
import {
  obtenerModulosParaPermisos,
  generarPlantillaPermisos,
} from "../system/modulos/modulosService";
import { Modulo, PermisosRol, PermisosModulo } from "../../types/roles";
import styles from "./PermisosSelector.module.css";

interface PermisosSelectorProps {
  permisos: PermisosRol;
  onChange: (permisos: PermisosRol) => void;
  readonly?: boolean;
  showStats?: boolean;
  showTemplates?: boolean;
}

const PermisosSelector: React.FC<PermisosSelectorProps> = ({
  permisos,
  onChange,
  readonly = false,
  showStats = true,
  showTemplates = true,
}) => {
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarModulos = async () => {
      try {
        const modulosDisponibles: Modulo[] = await obtenerModulosParaPermisos();
        setModulos(modulosDisponibles);
      } catch (error) {
        console.error("Error al cargar módulos:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarModulos();
  }, []);

  const aplicarPlantilla = async (
    tipo: "admin" | "manager" | "usuario" | "readonly"
  ) => {
    if (readonly) return;

    try {
      const permisosPlantilla: PermisosRol =
        await generarPlantillaPermisos(tipo);
      onChange(permisosPlantilla);
    } catch (error) {
      console.error("Error al aplicar plantilla:", error);
    }
  };

  const handlePermisoChange = (
    moduloId: string,
    accion: string,
    valor: boolean
  ) => {
    if (readonly) return;

    const nuevosPermisos: PermisosRol = {
      ...permisos,
      [moduloId]: {
        ...permisos[moduloId],
        [accion]: valor,
      },
    };
    onChange(nuevosPermisos);
  };

  const toggleTodoModulo = (moduloId: string, activar: boolean) => {
    if (readonly) return;

    const permisosModulo = permisos[moduloId] || {};
    const nuevosPermisos: PermisosRol = {
      ...permisos,
      [moduloId]: Object.keys(permisosModulo).reduce(
        (acc: PermisosModulo, accion: string) => {
          acc[accion] = activar;
          return acc;
        },
        {}
      ),
    };
    onChange(nuevosPermisos);
  };

  const calcularEstadisticas = () => {
    let totalPermisos = 0;
    let permisosActivos = 0;
    let modulosConPermisos = 0;

    Object.entries(permisos).forEach(([moduloId, moduloPermisos]) => {
      const permisosArray = Object.values(moduloPermisos);
      totalPermisos += permisosArray.length;
      const activosModulo = permisosArray.filter(Boolean).length;
      permisosActivos += activosModulo;

      if (activosModulo > 0) {
        modulosConPermisos++;
      }
    });

    return { totalPermisos, permisosActivos, modulosConPermisos };
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingIcon}>⏳</div>
        <div>Cargando módulos...</div>
      </div>
    );
  }

  const stats = calcularEstadisticas();

  return (
    <div className={styles.container}>
      {/* ✅ Header con título y estadísticas */}
      <div className={styles.header}>
        <div
          className={`${styles.headerTop} ${showStats ? "" : styles.headerTopNoStats}`}
        >
          <h3 className={styles.title}>
            <span>🔐</span>
            <span>Configuración de Permisos</span>
            {readonly && (
              <span className={styles.readonlyBadge}>Solo lectura</span>
            )}
          </h3>

          {/* ✅ Botones de plantillas */}
          {showTemplates && !readonly && (
            <div className={styles.templatesContainer}>
              <button
                type="button"
                onClick={() => aplicarPlantilla("admin")}
                className={`${styles.templateButton} ${styles.templateButtonAdmin}`}
              >
                🔴 Admin
              </button>
              <button
                type="button"
                onClick={() => aplicarPlantilla("manager")}
                className={`${styles.templateButton} ${styles.templateButtonManager}`}
              >
                🟠 Manager
              </button>
              <button
                type="button"
                onClick={() => aplicarPlantilla("usuario")}
                className={`${styles.templateButton} ${styles.templateButtonUser}`}
              >
                🔵 Usuario
              </button>
              <button
                type="button"
                onClick={() => aplicarPlantilla("readonly")}
                className={`${styles.templateButton} ${styles.templateButtonReadonly}`}
              >
                ⚫ Solo Lectura
              </button>
            </div>
          )}
        </div>

        {/* ✅ Estadísticas */}
        {showStats && (
          <div className={styles.stats}>
            <span className={styles.stat}>
              <span>📊</span>
              <span>
                {stats.permisosActivos}/{stats.totalPermisos} permisos activos
              </span>
            </span>
            <span className={styles.stat}>
              <span>🧩</span>
              <span>
                {stats.modulosConPermisos}/{modulos.length} módulos configurados
              </span>
            </span>
            <span className={styles.stat}>
              <span>📈</span>
              <span>
                {stats.totalPermisos > 0
                  ? Math.round(
                      (stats.permisosActivos / stats.totalPermisos) * 100
                    )
                  : 0}
                % completado
              </span>
            </span>
          </div>
        )}
      </div>

      {/* ✅ Grid de módulos */}
      <div className={styles.content}>
        <div className={styles.modulesGrid}>
          {modulos.map((modulo: Modulo) => {
            const permisosModulo: PermisosModulo = permisos[modulo.id] || {};
            const tienePermisos = Object.values(permisosModulo).some(Boolean);
            const totalPermisosModulo = Object.keys(permisosModulo).length;
            const permisosActivosModulo =
              Object.values(permisosModulo).filter(Boolean).length;

            return (
              <div
                key={modulo.id}
                className={`${styles.module} ${tienePermisos ? styles.moduleActive : ""}`}
              >
                {/* ✅ Header del módulo */}
                <div className={styles.moduleHeader}>
                  <div className={styles.moduleInfo}>
                    <h4>
                      <span className={styles.moduleIcon}>{modulo.icono}</span>
                      <span>{modulo.nombre}</span>
                      {tienePermisos && (
                        <span className={styles.moduleBadge}>
                          {permisosActivosModulo}/{totalPermisosModulo}
                        </span>
                      )}
                    </h4>
                    <p className={styles.moduleDescription}>
                      {modulo.descripcion}
                    </p>
                  </div>

                  {/* ✅ Botones de control del módulo */}
                  {!readonly && (
                    <div className={styles.moduleControls}>
                      <button
                        type="button"
                        onClick={() => toggleTodoModulo(modulo.id, true)}
                        className={`${styles.moduleControlButton} ${styles.moduleControlButtonAll}`}
                      >
                        ✅ Todos
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleTodoModulo(modulo.id, false)}
                        className={`${styles.moduleControlButton} ${styles.moduleControlButtonNone}`}
                      >
                        ❌ Ninguno
                      </button>
                    </div>
                  )}
                </div>

                {/* ✅ Checkboxes de permisos */}
                <div className={styles.permissionsGrid}>
                  {Object.entries(permisosModulo).map(
                    ([accion, valor]: [string, boolean]) => (
                      <label
                        key={accion}
                        className={`
                        ${styles.permissionLabel}
                        ${readonly ? styles.permissionLabelReadonly : ""}
                        ${valor ? styles.permissionLabelActive : ""}
                      `}
                      >
                        <input
                          type="checkbox"
                          checked={valor}
                          onChange={(e) =>
                            handlePermisoChange(
                              modulo.id,
                              accion,
                              e.target.checked
                            )
                          }
                          disabled={readonly}
                          className={`
                          ${styles.permissionCheckbox}
                          ${readonly ? styles.permissionCheckboxReadonly : ""}
                        `}
                        />
                        <span
                          className={`
                        ${styles.permissionText}
                        ${valor ? styles.permissionTextActive : ""}
                      `}
                        >
                          {accion}
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ✅ Mensaje si no hay módulos */}
        {modulos.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🧩</div>
            <h3 className={styles.emptyTitle}>No hay módulos disponibles</h3>
            <p className={styles.emptyDescription}>
              Configure los módulos del sistema para poder asignar permisos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PermisosSelector;

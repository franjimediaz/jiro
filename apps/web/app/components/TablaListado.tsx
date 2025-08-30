"use client";

import React, { useState } from "react";
import "./TablaListado.css";
import { format, parseISO, isValid } from "date-fns";
import * as Papa from "papaparse";

type Columna = {
  clave: string;
  encabezado: string;
  tipo?: "texto" | "checkbox";
  render?: (valor: any, fila: any) => React.ReactNode;
};

type Props = {
  columnas: Columna[];
  datos: any[];
  titulo?: string;
  onVer?: (fila: any) => void;
  onEditar?: (fila: any) => void;
  onEliminar?: (fila: any) => void;
  idRelacionado?: string;
  campoRelacion?: string;
  registrosPorPagina?: number;
  mostrarImportar?: boolean;
  onImport?: (registros: any[]) => void;
  exportC?: Columna[];
  importUrl?: string;
};
const obtenerValor = (obj: any, ruta: string) => {
  return ruta.split(".").reduce((acc, parte) => acc?.[parte], obj);
};
const esFechaValida = (valor: any) => {
  if (typeof valor !== "string") return false;
  const fecha = parseISO(valor);
  return isValid(fecha);
};

const formatearFecha = (valor: any) => {
  const fecha = parseISO(valor);
  return isValid(fecha) ? format(fecha, "dd/MM/yyyy") : valor;
};

const TablaListado: React.FC<Props> = ({
  columnas,
  datos,
  titulo,
  onVer,
  onEditar,
  onEliminar,
  idRelacionado,
  campoRelacion,
  registrosPorPagina = 5,
  mostrarImportar = true,
  onImport,
  exportC,
  importUrl,
}) => {
  const mostrarAcciones = onVer || onEditar || onEliminar;
  const datosSeguros = Array.isArray(datos) ? datos : [];
  const camposBuscables = exportC && exportC.length > 0 ? exportC : columnas;
  const [filtros, setFiltros] = useState<{ [clave: string]: string }>({});
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const datosFiltradosBase =
    idRelacionado && campoRelacion
      ? datosSeguros.filter((fila) => fila[campoRelacion] === idRelacionado)
      : datosSeguros;

  const datosFiltrados = datosFiltradosBase.filter((fila) =>
    camposBuscables.every((col) => {
      const filtro = filtros[col.clave]?.toLowerCase() ?? "";
      if (!filtro) return true;
      const valor = obtenerValor(fila, col.clave);
      return valor !== undefined && valor !== null
        ? String(valor).toLowerCase().includes(filtro)
        : false;
    })
  );

  const [menuActivo, setMenuActivo] = useState<string | null>(null);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const toggleMenu = (id: string) => {
    setMenuActivo((prev) => (prev === id ? null : id));
  };
  const [paginaActual, setPaginaActual] = useState(1);

  const totalPaginas = Math.ceil(datosFiltrados.length / registrosPorPagina);
  const datosPaginados = datosFiltrados.slice(
    (paginaActual - 1) * registrosPorPagina,
    paginaActual * registrosPorPagina
  );
  const exportarPlantillaCSV = () => {
    const campos = exportC && exportC.length > 0 ? exportC : columnas;
    const encabezados = campos.map((col) => col.clave).join(";");
    // Filtra los datos que se están mostrando en la tabla
    const filas = datosFiltrados.map((fila) =>
      campos
        .map((col) => {
          const valor = obtenerValor(fila, col.clave);
          // Si es un objeto, lo convertimos a string
          if (typeof valor === "object" && valor !== null) {
            return JSON.stringify(valor);
          }
          return valor ?? "";
        })
        .join(";")
    );
    // Une encabezados y filas
    const contenidoCSV = [encabezados, ...filas].join("\n");
    const blob = new Blob([contenidoCSV], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "tabla.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const handleMenuClick = (
    id: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    toggleMenu(id);
    const rect = event.currentTarget.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom, left: rect.left });
  };
  const handleImportCSV = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: ";",
      complete: async (result) => {
        if (importUrl) {
          try {
            for (const registroRaw of result.data) {
              if (typeof registroRaw !== "object" || registroRaw === null)
                continue;
              const registro = { ...registroRaw } as any;
              const convertirFecha = (fecha: string | undefined) => {
                if (!fecha || typeof fecha !== "string") return fecha;
                // Si ya es formato ISO, no hace nada
                if (/^\d{4}-\d{2}-\d{2}/.test(fecha)) return fecha;
                // Si es DD/MM/YYYY
                const partes = fecha.split("/");
                return fecha;
              };

              if (registro.fechaInicio)
                registro.fechaInicio = convertirFecha(registro.fechaInicio);
              if (registro.fechaFin)
                registro.fechaFin = convertirFecha(registro.fechaFin);

              // Conversión de tipos
              if (registro.precio) registro.precio = Number(registro.precio);
              if (registro.stockActual)
                registro.stockActual = Number(registro.stockActual);

              // Elimina id si no es válido
              delete registro.id;

              const idValido =
                registro.id !== undefined &&
                registro.id !== null &&
                registro.id !== "" &&
                !isNaN(Number(registro.id)) &&
                Number(registro.id) > 0;

              let metodo = "POST";
              let url = importUrl;

              if (idValido) {
                metodo = "PUT";
                url = `${importUrl}/${registro.id}`;
              } else {
                delete registro.id; // Elimina id si no es válido para evitar errores en el backend
              }

              // Verifica campos obligatorios
              if (importUrl?.includes("/materiales")) {
                if (
                  !registro?.nombre ||
                  !registro?.descripcion ||
                  !registro?.proveedor ||
                  isNaN(registro?.precio)
                ) {
                  console.error("Registro inválido (material):", registro);
                  continue;
                }
              } else if (importUrl?.includes("/obras")) {
                if (
                  !registro?.nombre ||
                  !registro?.direccion ||
                  !registro?.fechaInicio ||
                  !registro?.fechaFin ||
                  !registro?.estadoId ||
                  !registro?.clienteId
                ) {
                  console.error("Registro inválido (obra):", registro);
                  continue;
                }
              }

              const response = await fetch(url, {
                method: metodo,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(registro),
              });

              const contentType = response.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) {
                const resData = await response.json();
                console.log("Respuesta del servidor:", resData);
              } else {
                const text = await response.text();
                console.error("Respuesta no JSON:", text);
                throw new Error(
                  "La respuesta no es JSON. Verifica la URL y el backend."
                );
              }

              if (!response.ok) {
                throw new Error(
                  `Error en registro: ${JSON.stringify(registro)}`
                );
              }
            }
            alert("Registros importados correctamente");
          } catch (error) {
            alert("Error al importar registros");
            console.error("Error al importar:", error);
            console.log("Datos enviados:", result.data);
          }
        } else if (onImport) {
          onImport(result.data);
        } else {
          console.log("Registros importados:", result.data);
        }
      },
    });
  };

  const handleFiltroChange = (clave: string, valor: string) => {
    setFiltros((prev) => ({ ...prev, [clave]: valor }));
  };

  return (
    <div className="tabla-container">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {titulo && <h2 className="tabla-titulo">{titulo}</h2>}
        <button
          title="Mostrar filtros"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "1.5rem",
          }}
          onClick={() => setMostrarFiltros((prev) => !prev)}
        >
          🔍
        </button>

        {mostrarImportar && (
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem" }}>
            <label className="btn-import-csv">
              Importar CSV
              <input
                type="file"
                accept=".csv"
                style={{ display: "none" }}
                onChange={handleImportCSV}
              />
            </label>
            <button className="btn-export-csv" onClick={exportarPlantillaCSV}>
              Exportar CSV
            </button>
          </div>
        )}
      </div>
      {mostrarFiltros && (
        <div className="filtros-wrapper">
          {camposBuscables.map((col) => (
            <input
              key={col.clave}
              type="text"
              placeholder={`Buscar por ${col.encabezado}`}
              value={filtros[col.clave] ?? ""}
              onChange={(e) => handleFiltroChange(col.clave, e.target.value)}
              style={{ padding: "0.3rem", minWidth: "150px" }}
            />
          ))}
          <button
            className="btn-limpiar-filtros"
            onClick={() => setFiltros({})}
          >
            Limpiar filtros
          </button>
        </div>
      )}

      <table className="tabla-listado">
        <thead>
          <tr role="row">
            {columnas.map((col) => (
              <th key={col.clave} role="columnheader">
                {col.encabezado}
              </th>
            ))}
            {mostrarAcciones && <th role="columnheader">#</th>}
          </tr>
        </thead>
        <tbody>
          {datosPaginados.length === 0 ? (
            <tr>
              <td colSpan={columnas.length + (mostrarAcciones ? 1 : 0)}>
                No hay datos para mostrar.
              </td>
            </tr>
          ) : Array.isArray(datosPaginados) ? (
            datosPaginados.map((fila, i) => (
              <tr key={fila.id ?? i} role="row">
                {columnas.map((col) => (
                  <td key={col.clave} role="cell">
                    {col.render ? (
                      col.render(obtenerValor(fila, col.clave), fila)
                    ) : col.tipo === "checkbox" ? (
                      obtenerValor(fila, col.clave) ? (
                        <span style={{ color: "green" }}>✔️</span>
                      ) : (
                        <span style={{ color: "red" }}>❌</span>
                      )
                    ) : typeof obtenerValor(fila, col.clave) === "object" &&
                      obtenerValor(fila, col.clave)?.color &&
                      obtenerValor(fila, col.clave)?.icono ? (
                      <span
                        style={{
                          color: obtenerValor(fila, col.clave).color,
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <span>{obtenerValor(fila, col.clave).icono}</span>
                        <span>{obtenerValor(fila, col.clave).nombre}</span>
                      </span>
                    ) : esFechaValida(obtenerValor(fila, col.clave)) ? (
                      formatearFecha(obtenerValor(fila, col.clave))
                    ) : (
                      obtenerValor(fila, col.clave)
                    )}
                  </td>
                ))}
                {mostrarAcciones && (
                  <td
                    style={{ position: "relative", overflow: "visible" }}
                    role="cell"
                  >
                    <div className="menu-acciones-wrapper">
                      <button
                        className="btn-menu-acciones"
                        aria-haspopup="true"
                        aria-expanded={menuActivo === fila.id}
                        aria-label="Abrir menú de acciones"
                        onClick={(e) => handleMenuClick(fila.id, e)}
                      >
                        ⋮
                      </button>
                      {menuActivo === fila.id && (
                        <div
                          className="menu-acciones-dropdown"
                          style={{
                            top: dropdownPos?.top ?? 0,
                            left: dropdownPos?.left ?? 0,
                            position: "fixed",
                            zIndex: 9999,
                          }}
                        >
                          {onVer && (
                            <div
                              className="menu-item"
                              onClick={() => onVer(fila)}
                            >
                              👁 Ver
                            </div>
                          )}
                          {onEditar && (
                            <div
                              className="menu-item"
                              onClick={() => onEditar(fila)}
                            >
                              ✏️ Editar
                            </div>
                          )}
                          {onEliminar && (
                            <div
                              className="menu-item"
                              onClick={() => onEliminar(fila)}
                            >
                              🗑️ Eliminar
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columnas.length + (mostrarAcciones ? 1 : 0)}>
                ❌ Error: los datos no son un array
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {totalPaginas > 1 && (
        <div className="paginacion">
          {Array.from({ length: totalPaginas }, (_, index) => (
            <button
              key={index}
              onClick={() => setPaginaActual(index + 1)}
              className={paginaActual === index + 1 ? "activo" : ""}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TablaListado;

export type { Columna };

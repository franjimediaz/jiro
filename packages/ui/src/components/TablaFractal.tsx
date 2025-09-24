"use client";

import React, { useState } from "react";
import "./TablaFractal.css";

type Columna = {
  clave: string;
  encabezado: string;
  render?: (valor: any, fila: any) => React.ReactNode;
};

type Props = {
  columnas: Columna[];
  datos: any[]; // deben venir con estructura recursiva: cada fila puede tener un array `hijos`
  titulo?: string;
  onEditar?: (fila: any) => void;
  onEliminar?: (fila: any) => void;
  nivel?: number; // para indentación visual recursiva
};

const TablaFractal: React.FC<Props> = ({
  columnas,
  datos,
  titulo,
  onEditar,
  onEliminar,
  nivel = 0,
}) => {
  const indent = (nivel: number) => ({
    paddingLeft: `${nivel * 20}px`,
  });
  const [nodosAbiertos, setNodosAbiertos] = useState<Set<number>>(new Set());
  const toggleNodo = (id: number) => {
    setNodosAbiertos((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) {
        nuevo.delete(id);
      } else {
        nuevo.add(id);
      }
      return nuevo;
    });
  };

  const renderFila = (fila: any, nivelActual: number) => (
    <React.Fragment key={`fila-${fila.id}-nivel-${nivelActual}`}>
      <tr>
        {columnas.map((col, idx) => (
          <td key={col.clave}>
            <div style={idx === 0 ? indent(nivelActual) : undefined}>
              {fila.hijos?.length > 0 && idx === 0 && (
                <span
                  onClick={() => toggleNodo(fila.id)}
                  style={{ cursor: "pointer", marginRight: 6 }}
                >
                  {nodosAbiertos.has(fila.id) ? "▼" : "▶"}
                </span>
              )}
              {col.render ? col.render(fila[col.clave], fila) : fila[col.clave]}
            </div>
          </td>
        ))}
        <td>
          <div className="tabla-acciones">
            {onEditar && (
              <button className="btn btn-editar" onClick={() => onEditar(fila)}>
                ✏️
              </button>
            )}
            {onEliminar && (
              <button
                className="btn btn-eliminar"
                onClick={() => onEliminar(fila)}
              >
                🗑️
              </button>
            )}
          </div>
        </td>
      </tr>

      {Array.isArray(fila.hijos) &&
        nodosAbiertos.has(fila.id) &&
        fila.hijos.map((hijo: any) => renderFila(hijo, nivelActual + 1))}
    </React.Fragment>
  );

  return (
    <div className="tabla-container">
      {titulo && <h2 className="tabla-titulo">{titulo}</h2>}
      <table className="tabla-fractal">
        <thead>
          <tr>
            {columnas.map((col) => (
              <th key={col.clave}>{col.encabezado}</th>
            ))}
            <th>#</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(datos) && datos.length > 0 ? (
            datos.map((fila) => renderFila(fila, nivel))
          ) : (
            <tr>
              <td colSpan={columnas.length + 1}>⚠️ No hay datos disponibles</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TablaFractal;

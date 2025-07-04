'use client';

import React from 'react';
import './TablaListado.css';

type Columna = {
  clave: string;
  encabezado: string;
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
}) => {
  const mostrarAcciones = onVer || onEditar || onEliminar;
  const datosFiltrados = idRelacionado && campoRelacion
    ? datos.filter((fila) => fila[campoRelacion] === idRelacionado)
    : datos;

  return (
    <div className="tabla-container">
      {titulo && <h2 className="tabla-titulo">{titulo}</h2>}
      <table className="tabla-listado">
        <thead>
          <tr>
            {columnas.map((col) => (
              <th key={col.clave}>{col.encabezado}</th>
            ))}
            {mostrarAcciones && <th>#</th>}
          </tr>
        </thead>
        <tbody>
  {Array.isArray(datosFiltrados) ? (
    
    datosFiltrados.map((fila, i) => (
      <tr key={i}>
        {columnas.map((col) => (
          <td key={col.clave}>
            {col.render
              ? col.render(fila[col.clave], fila)
              : fila[col.clave]}
          </td>
        ))}
        {mostrarAcciones && (
          <td>
            <div className="tabla-acciones">
              {onVer && (
                <button className="btn btn-ver" onClick={() => onVer(fila)}>👁 Ver</button>
              )}
              {onEditar && (
                <button className="btn btn-editar" onClick={() => onEditar(fila)}>✏️ Editar</button>
              )}
              {onEliminar && (
                <button className="btn btn-eliminar" onClick={() => onEliminar(fila)}>🗑️ Eliminar</button>
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
    </div>
  );
};

export default TablaListado;

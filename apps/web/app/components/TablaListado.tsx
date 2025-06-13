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
};

const TablaListado: React.FC<Props> = ({
  columnas,
  datos,
  titulo,
  onVer,
  onEditar,
  onEliminar,
}) => {
  const mostrarAcciones = onVer || onEditar || onEliminar;

  return (
    <div style={{ padding: '1rem' }}>
      {titulo && <h2>{titulo}</h2>}
      <table>
        <thead>
          <tr>
            {columnas.map((col) => (
              <th key={col.clave}>{col.encabezado}</th>
            ))}
            {mostrarAcciones && <th>\\</th>}
          </tr>
        </thead>
        <tbody>
          {datos.map((fila, i) => (
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
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {onVer && (
                      <button onClick={() => onVer(fila)}>👁 Ver</button>
                    )}
                    {onEditar && (
                      <button onClick={() => onEditar(fila)}>✏️ Editar</button>
                    )}
                    {onEliminar && (
                      <button onClick={() => onEliminar(fila)}>🗑 Eliminar</button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TablaListado;

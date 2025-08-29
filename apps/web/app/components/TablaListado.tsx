'use client';

import React, { useState } from 'react';
import './TablaListado.css';

type Columna = {
  clave: string;
  encabezado: string;
  tipo?: 'texto' | 'checkbox'| undefined;
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
  const datosSeguros = Array.isArray(datos) ? datos : [];

const datosFiltrados = idRelacionado && campoRelacion
  ? datosSeguros.filter((fila) => fila[campoRelacion] === idRelacionado)
  : datosSeguros;
    const obtenerValor = (obj: any, ruta: string) => {
      return ruta.split('.').reduce((acc, parte) => acc?.[parte], obj);
    };
    const [menuActivo, setMenuActivo] = useState<string | null>(null);

    const toggleMenu = (id: string) => {
      setMenuActivo((prev) => (prev === id ? null : id));
    };
    const registrosPorPagina = 5;
    const [paginaActual, setPaginaActual] = useState(1);
    const totalPaginas = Math.ceil(datosFiltrados.length / registrosPorPagina);
    const datosPaginados = datosFiltrados.slice(
      (paginaActual - 1) * registrosPorPagina,
      paginaActual * registrosPorPagina
    );
    const esFechaValida = (valor: any) => {
      if (typeof valor !== 'string') return false; // Solo cadenas ISO
      const fecha = new Date(valor);
      return !isNaN(fecha.getTime()) && valor.includes('-');
    };

  const formatearFecha = (valor: any) => {
    const fecha = new Date(valor);
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

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
  {Array.isArray(datosPaginados) ? (
    
    datosPaginados.map((fila, i) => (
      <tr key={i}>
        {columnas.map((col) => (
          <td key={col.clave}>
            {col.render
              ? col.render(obtenerValor(fila, col.clave), fila)
              : col.tipo === 'checkbox'
                ? obtenerValor(fila, col.clave)
                  ? <span style={{ color: 'green' }}>✔️</span>
                  : <span style={{ color: 'red' }}>❌</span>
                : typeof obtenerValor(fila, col.clave) === 'object' &&
                  obtenerValor(fila, col.clave)?.color &&
                  obtenerValor(fila, col.clave)?.icono
                  ? (
                    <span style={{
                      color: obtenerValor(fila, col.clave).color,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <span>{obtenerValor(fila, col.clave).icono}</span>
                      <span>{obtenerValor(fila, col.clave).nombre}</span>
                    </span>
                  )
                  : esFechaValida(obtenerValor(fila, col.clave))
                    ? formatearFecha(obtenerValor(fila, col.clave))
                    : obtenerValor(fila, col.clave)
            }


          </td>
        ))}
        {mostrarAcciones && (
          <td style={{ position: 'relative', overflow: 'visible' }}>
            <div className="menu-acciones-wrapper">
              <button
                className="btn-menu-acciones"
                onClick={() => toggleMenu(fila.id)}
              >
                ⋮
              </button>

      {menuActivo === fila.id && (
        <div className="menu-acciones-dropdown">
          {onVer && (
            <div className="menu-item" onClick={() => onVer(fila)}>👁 Ver</div>
          )}
          {onEditar && (
            <div className="menu-item" onClick={() => onEditar(fila)}>✏️ Editar</div>
          )}
          {onEliminar && (
            <div className="menu-item" onClick={() => onEliminar(fila)}>🗑️ Eliminar</div>
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
        className={paginaActual === index + 1 ? 'activo' : ''}
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

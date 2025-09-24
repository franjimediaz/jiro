'use client';
import React from 'react';
import styles from './SubtablaEditable.module.css';

type Columna = {
  clave: string;
  label: string;
};

type Props = {
  columnas: Columna[];
  datos: Record<string, any>[];
  onAdd?: (nuevo: any) => void;
  onEdit?: (index: number, actualizado: any) => void;
  onDelete?: (index: number) => void;
  editable?: boolean;
};

const SubtablaEditable: React.FC<Props> = ({ columnas, datos, onAdd, onEdit, onDelete, editable = false }) => {
  const manejarAgregar = () => {
    const nuevo: Record<string, any> = {};
    columnas.forEach((col) => {
      nuevo[col.clave] = '';
    });
    onAdd?.(nuevo);
  };

  const manejarEditarCampo = (index: number, clave: string, valor: any) => {
    const filaActual = { ...datos[index], [clave]: valor };
    onEdit?.(index, filaActual);
  };

  return (
    <div className={styles.wrapper}>
      <table className={styles.tabla}>
        <thead>
          <tr>
            {columnas.map((col) => (
              <th key={col.clave}>{col.label}</th>
            ))}
            {editable && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {datos.map((fila, i) => (
            <tr key={i}>
              {columnas.map((col) => (
                <td key={col.clave}>
                  {editable ? (
                    <input
                      type="text"
                      value={fila[col.clave]}
                      onChange={(e) => manejarEditarCampo(i, col.clave, e.target.value)}
                      className={styles.input}
                    />
                  ) : (
                    fila[col.clave]
                  )}
                </td>
              ))}
              {editable && (
                <td>
                  <button type="button" className={styles.botonEliminar} onClick={() => onDelete?.(i)}>
                    🗑
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {editable && (
        <button type="button" className={styles.botonAgregar} onClick={manejarAgregar}>
          ➕ Añadir fila
        </button>
      )}
    </div>
  );
};

export default SubtablaEditable;

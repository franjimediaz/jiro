'use client';

import React from 'react';
import styles from './FormularioTabla.module.css';

type Campo = {
  nombre: string;
  etiqueta: string;
  tipo?: string;
  placeholder?: string;
  opciones?: { value: string; label: string }[];
};

type Props = {
  titulo?: string;
  campos: Campo[];
  valores: Record<string, any>;
  onChange?: (nombre: string, valor: any) => void;
  onSubmit?: () => void;
  botonTexto?: string;
  soloLectura?: boolean;
};

const FormularioTabla: React.FC<Props> = ({
  titulo,
  campos,
  valores,
  onChange,
  onSubmit,
  botonTexto = 'Guardar',
  soloLectura = false,
}) => {
  return (
    <div className={styles.formWrapper}>
      {titulo && <h2 className={styles.titulo}>{titulo}</h2>}
      <table className={styles.formularioTabla}>
        <tbody>
          {campos.map((campo) => (
            <tr key={campo.nombre}>
              <td className={styles.etiqueta}>{campo.etiqueta}</td>
              <td className={styles.campo}>
                {soloLectura ? (
                  <span>{valores[campo.nombre]?.toString() || '-'}</span>
                ) : campo.tipo === 'textarea' ? (
                  <textarea
                    placeholder={campo.placeholder || ''}
                    value={valores[campo.nombre] || ''}
                    onChange={(e) => onChange?.(campo.nombre, e.target.value)}
                    className={styles.textarea}
                  />
                ) : campo.tipo === 'select' ? (
                  <select
                    value={valores[campo.nombre] || ''}
                    onChange={(e) => onChange?.(campo.nombre, e.target.value)}
                    className={styles.select}
                  >
                    <option value="">Selecciona una opción</option>
                    {campo.opciones?.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                ) : campo.tipo === 'checkbox' ? (
                  <input
                    type="checkbox"
                    checked={!!valores[campo.nombre]}
                    onChange={(e) => onChange?.(campo.nombre, e.target.checked)}
                    className={styles.checkbox}
                  />
                ) : (
                  <input
                    type="text"
                    placeholder={campo.placeholder || ''}
                    value={valores[campo.nombre] || ''}
                    onChange={(e) => onChange?.(campo.nombre, e.target.value)}
                    className={styles.input}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!soloLectura && onSubmit && (
        <button onClick={onSubmit} className={styles.boton}>
          {botonTexto}
        </button>
      )}
    </div>
  );
};

export default FormularioTabla;

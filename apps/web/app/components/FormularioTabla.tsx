'use client';

import React from 'react';

type Campo = {
  nombre: string;
  etiqueta: string;
  tipo?: string;
  placeholder?: string;
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
    <div style={{ padding: '1rem', maxWidth: '600px' }}>
      {titulo && <h2>{titulo}</h2>}
      <table>
        <tbody>
          {campos.map((campo) => (
            <tr key={campo.nombre}>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>{campo.etiqueta}</td>
              <td style={{ padding: '8px' }}>
                {soloLectura ? (
                  <span>{valores[campo.nombre] || '-'}</span>
                ) : (
                  <input
                    type={campo.tipo || 'text'}
                    placeholder={campo.placeholder || ''}
                    value={valores[campo.nombre] || ''}
                    onChange={(e) => onChange?.(campo.nombre, e.target.value)}
                    style={{ width: '100%', padding: '6px' }}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!soloLectura && onSubmit && (
        <button
          onClick={onSubmit}
          style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
        >
          {botonTexto}
        </button>
      )}
    </div>
  );
};

export default FormularioTabla;

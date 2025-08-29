'use client';
import React, { useState } from 'react';
import styles from './FormularioPasos.module.css';
import { Campo } from './FormularioTabla'; // importa desde donde tengas el tipo

type Paso = {
  titulo: string;
  campos: Campo[];
};

type Props = {
  pasos: Paso[];
  valores: Record<string, any>;
  onChange?: (nombre: string, valor: any) => void;
  soloLectura?: boolean;
};

const FormularioPasos: React.FC<Props> = ({ pasos, valores, onChange, soloLectura }) => {
  const [pasoActual, setPasoActual] = useState(0);

  const siguiente = () => {
    if (pasoActual < pasos.length - 1) setPasoActual(pasoActual + 1);
  };

  const anterior = () => {
    if (pasoActual > 0) setPasoActual(pasoActual - 1);
  };

if (!pasos || pasos.length === 0 || !pasos[pasoActual]) {
  return <p>No hay pasos definidos.</p>;
}
  return (
    
    <div className={styles.wrapper}>
      <h3 className={styles.tituloPaso}>{pasos[pasoActual].titulo}</h3>
      <table className={styles.formularioTabla}>
        <tbody>
          {pasos[pasoActual].campos.map((campo) => (
            <tr key={campo.nombre}>
              <td className={styles.etiqueta}>{campo.etiqueta}</td>
              <td className={styles.campo}>
                {/* Reutiliza el renderizado del campo original (modo edición/lectura) */}
                {/* Aquí puedes importar el renderizador o replicar el ternario */}
                <input
                  type={campo.tipo || 'text'}
                  value={valores[campo.nombre] || ''}
                  onChange={(e) => onChange?.(campo.nombre, e.target.value)}
                  disabled={soloLectura || campo.readOnly}
                  className={styles.input}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.botones}>
        {pasoActual > 0 && (
          <button type="button" className={styles.boton} onClick={anterior}>
            ⬅ Anterior
          </button>
        )}
        {pasoActual < pasos.length - 1 && (
          <button type="button" className={styles.boton} onClick={siguiente}>
            Siguiente ➡
          </button>
        )}
      </div>
    </div>
  );
};

export default FormularioPasos;

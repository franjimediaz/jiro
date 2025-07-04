'use client';

import React, { useState, useEffect } from 'react';
import styles from './FormularioTabla.module.css';
import { useRouter } from 'next/navigation';
import SelectorTabla from './SelectorTabla';
import IconSelector from './IconSelector';
import * as LucideIcons from 'lucide-react';


type Campo = {
  nombre: string;
  etiqueta: string;
  tipo?: string;
  placeholder?: string;
  opciones?: { value: string; label: string }[];
  tabla?: string; // solo si tipo === 'selectorTabla'
  campoLabel?: string;
  campoValue?: string;
  multiple?: boolean;
  readOnly?: boolean;
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
type OpcionExtendida = {
  label: string;
  value: any;
  icono?: string;
  color?: string;
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
  const router = useRouter();
const [opcionesCampos, setOpcionesCampos] = useState<Record<string, OpcionExtendida[]>>({});


useEffect(() => {
  const cargarOpciones = async () => {
    const nuevos: Record<string, { label: string; value: any }[]> = {};

    for (const campo of campos) {
      if (
        (soloLectura || campo.readOnly) &&
        campo.tipo === 'selectorTabla' &&
        campo.tabla &&
        campo.campoLabel &&
        campo.campoValue
      ) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${campo.tabla}`);
        const data = await res.json();

        nuevos[campo.nombre] = data.map((item: any) => ({
          label: item[campo.campoLabel!],
          value: item[campo.campoValue!],
          icono: item.icono,
          color: item.color,
        }));
      }
    }

    setOpcionesCampos(nuevos);
  };

  cargarOpciones();
}, [campos, soloLectura]);

  const renderValor = (campo: Campo, valor: any): React.ReactNode => {
  if (!valor) return '-';

  // SelectorTabla con datos cargados
  if (campo.tipo === 'selectorTabla') {
    const opciones = opcionesCampos[campo.nombre] || [];
    const op = opciones.find((o) => String(o.value) === String(valor));
    if (!op) return valor;
      if (op.icono && op.color) {
            return obtenerIconoLucide(op.icono, op.label, op.color);
        }
    return op?.label || valor;
  }

  // Select normal
  if (campo.tipo === 'select' && campo.opciones) {
    const op = campo.opciones.find((o) => String(o.value) === String(valor));
    return op?.label || valor;
  }

  return valor.toString();
};


const obtenerIconoLucide = (nombreIcono: string, nombreRegistro?: string, color: string = '#000') => {
  const Icono = (LucideIcons as any)[nombreIcono];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {Icono ? <Icono size={24} color={color} /> : <LucideIcons.Circle size={24} color="#ccc" />}
      <span style={{ color }} >{nombreRegistro || nombreIcono}</span>
    </div>
  );
};
  
  

  return (
    <div className={styles.formWrapper}>
      {titulo && <h2 className={styles.titulo}>{titulo}</h2>}
      <table className={styles.formularioTabla}>
        <tbody>
          {campos.map((campo) => (
            <tr key={campo.nombre}>
              <td className={styles.etiqueta}>{campo.etiqueta}</td>
              <td className={styles.campo}>
                
                {soloLectura || campo.readOnly ?  (
                  <span className={styles.readOnly}>
                    {renderValor(campo, valores[campo.nombre])}</span>
                ) : campo.tipo === 'textarea' ? (
                  <textarea
                    placeholder={campo.placeholder || ''}
                    value={valores[campo.nombre] || ''}
                    onChange={(e) => onChange?.(campo.nombre, e.target.value)}
                    className={styles.textarea}
                  />
                ) : campo.tipo === 'previsualizacion' ? (
                   <div className={styles.previsualizacionWrapper}>
                      <div className={styles.previsualizacionIcono}>
                        {obtenerIconoLucide(valores.icono, valores.nombre || valores.label, valores.color)}
                      </div>

                    </div>
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
                ) : campo.tipo === 'selectorTabla' ? (
                  <SelectorTabla
                    tabla={campo.tabla!}
                    campoLabel={campo.campoLabel!}
                    campoValue={campo.campoValue!}
                    label=""
                    multiple={campo.multiple}
                    valorSeleccionado={valores[campo.nombre]}
                    onChange={(valor) => onChange?.(campo.nombre, valor)}
                  />
                ) : campo.tipo === 'color' ? (
                  <input
                    type="color"
                    value={valores[campo.nombre] || '#000000'}
                    onChange={(e) => onChange?.(campo.nombre, e.target.value)}
                    className={styles.inputColor}
                  />
                ): campo.tipo === 'icono' ? (
                  <IconSelector
                      valor={valores[campo.nombre]}
                      onChange={(valor) => onChange?.(campo.nombre, valor)}
                    />

                ):
                (
                  <input
                    type={campo.tipo || 'text'}
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

      {!soloLectura && (
        <div className={styles.botones}>
          {onSubmit && (
            <button onClick={onSubmit} className={styles.boton}>
              {botonTexto}
            </button>
          )}
        </div>
      )}

      <button onClick={() => router.back()} className={styles.botonSecundario}>
        ⬅ Atrás
      </button>
    </div>
  );
};

export default FormularioTabla;

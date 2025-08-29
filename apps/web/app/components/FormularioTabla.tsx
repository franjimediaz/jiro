'use client';

import React, { useState, useEffect } from 'react';
import styles from './FormularioTabla.module.css';
import { useRouter } from 'next/navigation';
import SelectorTabla from './SelectorTabla';
import IconSelector from './IconSelector';
import * as LucideIcons from 'lucide-react';
import dynamic from 'next/dynamic';
import SubtablaEditable from './SubtablaEditable';
import FormularioPasos from './FormularioPasos';

type Paso = {
  titulo: string;
  campos: Campo[];
};

const RichTextEditor = dynamic(() => import('./utils/RichTextEditor'), { ssr: false });
type Columna = {
  clave: string;
  label: string;
};
export type Campo = {
  nombre: string;
  etiqueta: string;
  tipo?: string;
  placeholder?: string;
  opciones?: { value: string; label: string }[];
  tabla?: string;
  campoLabel?: string;
  campoValue?: string;
  multiple?: boolean;
  readOnly?: boolean;
  documento?: boolean;
  columnas?: Columna[];
  pasos?: Paso[];
};

type Props = {
  titulo?: string;
  campos: Campo[];
  valores: Record<string, any>;
  onChange?: (nombre: string, valor: any) => void;
  onSubmit?: () => void;
  botonTexto?: string;
  soloLectura?: boolean;
  tabla?: string;
  registroId?: number;
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
  tabla,
  registroId,
}) => {
  const router = useRouter();
  const [opcionesCampos, setOpcionesCampos] = useState<Record<string, OpcionExtendida[]>>({});
  const [subiendo, setSubiendo] = useState<string | null>(null);

  useEffect(() => {
    const cargarOpciones = async () => {
      const nuevos: Record<string, OpcionExtendida[]> = {};

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

  const subirArchivo = async (
  archivo: File,
  campo: Campo,
  tabla: string,
  registroId: number
) => {
  setSubiendo(campo.nombre);
  const formData = new FormData();
  formData.append('archivo', archivo);

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (data.fileUrl) {
      onChange?.(campo.nombre, data.fileUrl);

      // 👇 Extra: guardar en base de datos si es campo de documento
      if (campo.documento && tabla && registroId) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documentos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: archivo.name,
            url: data.fileUrl,
            tipo: archivo.type,
            tabla,
            registroId,
          }),
        });
      }
    } else {
      alert('Error al subir archivo.');
    }
  } catch (err) {
    console.error('Error al subir:', err);
    alert('Error al subir archivo.');
  } finally {
    setSubiendo(null);
  }
};

  const renderValor = (campo: Campo, valor: any): React.ReactNode => {
    if (!valor) return '-';
    if (campo.tipo === 'archivo') {
  const esImagen = /\.(png|jpg|jpeg|gif|webp)$/i.test(valor);

  const eliminarArchivo = async () => {
          if (!valores[campo.nombre]) return;
          const confirmado = confirm('¿Estás seguro de eliminar este archivo?');
          if (!confirmado) return;
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: valores[campo.nombre]}),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            // Vacía el valor del campo en el formulario
            onChange?.(campo.nombre, '');
          } catch (err) {
            console.error('Error al eliminar archivo:', err);
            alert('Error al eliminar archivo.');
          }
        };
              return (
                <div>
                  {esImagen ? (
                    <img src={process.env.NEXT_PUBLIC_API_URL + valor} alt={campo.nombre} style={{ maxWidth: '150px', borderRadius: '6px' }} />
                  ) : (
                    <a href={process.env.NEXT_PUBLIC_API_URL + valor} target="_blank" rel="noopener noreferrer">
                      Ver documento
                    </a>
                  )}
                  <button className={styles.botonSecundario} type="button" onClick={eliminarArchivo}>
                    🗑
                  </button>
                </div>
              );
}  

      if (campo.tipo === 'selectorTabla') {
      const opciones = opcionesCampos[campo.nombre] || [];
      const op = opciones.find((o) => String(o.value) === String(valor));
      if (!op) return valor;
      if (op.icono && op.color) {
        return obtenerIconoLucide(op.icono, op.label, op.color);
      }
      return op?.label || valor;
      }
      if (campo.tipo === 'select' && campo.opciones) {
      const op = campo.opciones.find((o) => String(o.value) === String(valor));
      return op?.label || valor;
      }
      if (campo.tipo === 'icono') {
        return obtenerIconoLucide(valor, valor, '#000');
      }
      if (campo.tipo === 'color') {
          return (
            <div style={{
              display: 'inline-block',
              width: '24px',
              height: '24px',
              backgroundColor: valor,
              border: '1px solid #ccc',
              borderRadius: '4px'
            }} title={valor} />
          );
      }
      if (campo.tipo === 'richtext') {
      return (
        <div
          className={styles.vistaHTML}
          dangerouslySetInnerHTML={{ __html: valor }}
        />
      );
      }
      if (campo.tipo === 'date' && valor) {
        const fecha = new Date(valor);
        return fecha.toLocaleDateString('es-ES'); // dd/mm/yyyy
      }
      if (campo.tipo === 'datetime-local' && valor) {
          const fechaHora = new Date(valor);
          return fechaHora.toLocaleString('es-ES'); // Formato legible con fecha y hora
      }
      if (campo.tipo === 'number' && typeof valor === 'number') {
          return valor.toLocaleString('es-ES'); // Con separador de miles y decimales si aplica
      }
      if (campo.tipo === 'password') {
          return '******'; // o puedes usar 🔒 si prefieres
      }
      if (campo.tipo === 'tags' && Array.isArray(valor)) {
            return (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {valor.map((tag, i) => (
                  <span key={i} style={{
                    backgroundColor: '#eef',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem'
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            );
      }
      if (campo.tipo === 'tags' && Array.isArray(valor)) {
          return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {valor.map((tag, i) => (
                <span key={i} style={{
                  backgroundColor: '#eef',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '12px',
                  fontSize: '0.85rem'
                }}>
                  {tag}
                </span>
              ))}
            </div>
          );
      }
      if (campo.tipo === 'radio' && campo.opciones) {
          const op = campo.opciones.find((o) => String(o.value) === String(valor));
          return op?.label || valor;
      }
      if (campo.tipo === 'slider') {
          return `${valor} / 100`;
      }
      if (campo.tipo === 'stepper') {
          return valor ?? 0;
      }
      if (campo.tipo === 'email') {
        return <a href={`mailto:${valor}`}>{valor}</a>;
      }

      if (campo.tipo === 'tel') {
        return <a href={`tel:${valor}`}>{valor}</a>;
      }
      if (campo.tipo === 'subtabla' && Array.isArray(valor)) {
          return (
            <table className={styles.subtablaLectura}>
              <thead>
                <tr>
                  {(campo.columnas || []).map((col) => (
                    <th key={col.clave}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {valor.map((fila, i) => (
                  <tr key={i}>
                    {(campo.columnas || []).map((col) => (
                      <td key={col.clave}>{fila[col.clave]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        }


    return valor.toString();
  };

  const obtenerIconoLucide = (nombreIcono: string, nombreRegistro?: string, color: string = '#000') => {
    const Icono = (LucideIcons as any)[nombreIcono];
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {Icono ? <Icono size={24} color={color} /> : <LucideIcons.Circle size={24} color="#ccc" />}
        <span style={{ color }}>{nombreRegistro || nombreIcono}</span>
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
                {soloLectura || campo.readOnly ? (
                  <span className={styles.readOnly}>{renderValor(campo, valores[campo.nombre])}</span>
                ) : campo.tipo === 'richtext' ? (
                    <RichTextEditor
                    value={valores[campo.nombre] || ''}
                    onChange={(valor) => onChange?.(campo.nombre, valor)}
                  />
                
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
                  <><SelectorTabla
                    tabla={campo.tabla!}
                    campoLabel={campo.campoLabel!}
                    campoValue={campo.campoValue!}
                    label=""
                    multiple={campo.multiple}
                    valorSeleccionado={valores[campo.nombre]}
                    onChange={(valor) => onChange?.(campo.nombre, valor)}
                  />
                       {(() => {
                            const opciones = opcionesCampos[campo.nombre] || [];
                            const op = opciones.find((o) => String(o.value) === String(valores[campo.nombre]));
                            if (op?.icono && op?.color) {
                              return (
                                <div style={{ marginTop: '0.5rem' }}>
                                  {obtenerIconoLucide(op.icono, op.label, op.color)}
                                </div>
                              );
                            }
                            return null;
                          })()}
                  </>
                  
                ) : campo.tipo === 'color' ? (
                  <input
                    type="color"
                    value={valores[campo.nombre] || '#000000'}
                    onChange={(e) => onChange?.(campo.nombre, e.target.value)}
                    className={styles.inputColor}
                  />
                ) : campo.tipo === 'date' ? (
                  <input
                    type="date"
                    value={valores[campo.nombre] || ''}
                    onChange={(e) => onChange?.(campo.nombre, e.target.value)}
                    className={styles.input}
                  />
                
                ) : campo.tipo === 'datetime-local' ? (
                    <input
                      type="datetime-local"
                      value={valores[campo.nombre] || ''}
                      onChange={(e) => onChange?.(campo.nombre, e.target.value)}
                      className={styles.input}
                    />
                ) : campo.tipo === 'password' ? (
                      <input
                        type="password"
                        value={valores[campo.nombre] || ''}
                        onChange={(e) => onChange?.(campo.nombre, e.target.value)}
                        className={styles.input}
                      />
                ) : campo.tipo === 'tags' ? (
                        <div className={styles.tagsInputWrapper}>
                          {(valores[campo.nombre] || []).map((tag: string, index: number) => (
                            <span key={index} className={styles.tag}>
                              {tag}
                              <button
                                type="button"
                                onClick={() =>
                                  onChange?.(
                                    campo.nombre,
                                    valores[campo.nombre].filter((_: string, i: number) => i !== index)
                                  )
                                }
                                className={styles.tagRemove}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          <input
                            type="text"
                            className={styles.tagInput}
                            placeholder="Añadir etiqueta"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const nueva = (e.target as HTMLInputElement).value.trim();
                                if (nueva) {
                                  onChange?.(campo.nombre, [...(valores[campo.nombre] || []), nueva]);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }
                            }}
                          />
                        </div>
                ) : campo.tipo === 'radio' ? (
                      <div className={styles.radioGroup}>
                        {campo.opciones?.map((opcion) => (
                          <label key={opcion.value} className={styles.radioLabel}>
                            <input
                              type="radio"
                              name={campo.nombre}
                              value={opcion.value}
                              checked={valores[campo.nombre] === opcion.value}
                              onChange={() => onChange?.(campo.nombre, opcion.value)}
                            />
                            {opcion.label}
                          </label>
                        ))}
                      </div>
                ) : campo.tipo === 'slider' ? (
                      <div className={styles.sliderWrapper}>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={valores[campo.nombre] || 0}
                          onChange={(e) => onChange?.(campo.nombre, Number(e.target.value))}
                          className={styles.slider}
                        />
                        <span className={styles.sliderValor}>{valores[campo.nombre] || 0}</span>
                      </div>
                ) : campo.tipo === 'stepper' ? (
                      <div className={styles.stepperWrapper}>
                        <button
                          type="button"
                          className={styles.stepperBoton}
                          onClick={() => onChange?.(campo.nombre, Math.max(0, (valores[campo.nombre] || 0) - 1))}
                        >
                          –
                        </button>
                        <input
                          type="number"
                          value={valores[campo.nombre] || 0}
                          readOnly
                          className={styles.stepperInput}
                        />
                        <button
                          type="button"
                          className={styles.stepperBoton}
                          onClick={() => onChange?.(campo.nombre, (valores[campo.nombre] || 0) + 1)}
                        >
                          +
                        </button>
                      </div>
                ) : campo.tipo === 'subtabla' ? (
                    <div className={styles.subtablaWrapper}>
                      <SubtablaEditable
                        columnas={campo.columnas || []}
                        datos={valores[campo.nombre] || []}
                        onAdd={(nuevo) => {
                          const lista = [...(valores[campo.nombre] || [])];
                          lista.push(nuevo);
                          onChange?.(campo.nombre, lista);
                        }}
                        onEdit={(i, actualizado) => {
                          const lista = [...(valores[campo.nombre] || [])];
                          lista[i] = actualizado;
                          onChange?.(campo.nombre, lista);
                        }}
                        onDelete={(i) => {
                          const lista = [...(valores[campo.nombre] || [])];
                          lista.splice(i, 1);
                          onChange?.(campo.nombre, lista);
                        }}
                        editable
                      />
                    </div>
                ) : campo.tipo === 'pasos' ? (
                  <FormularioPasos
                    pasos={campo.pasos || []}
                    valores={valores}
                    onChange={onChange}
                    soloLectura={soloLectura}
                  />
                ) : campo.tipo === 'email' ? (
                        <input
                          type="email"
                          placeholder={campo.placeholder || ''}
                          value={valores[campo.nombre] || ''}
                          onChange={(e) => onChange?.(campo.nombre, e.target.value)}
                          className={styles.input}
                        />
                ) : campo.tipo === 'tel' ? (
                        <input
                          type="tel"
                          placeholder={campo.placeholder || ''}
                          value={valores[campo.nombre] || ''}
                          onChange={(e) => onChange?.(campo.nombre, e.target.value)}
                          className={styles.input}
                        />
                ) : campo.tipo === 'number' ? (
                      <input
                        type="number"
                        value={valores[campo.nombre] ?? ''}
                        onChange={(e) => onChange?.(campo.nombre, e.target.valueAsNumber)}
                        className={styles.input}
                      />
                ) : campo.tipo === 'archivo' ? (
                  <div className={styles.previsualizacionArchivo}>
                    <input
                      type="file"
                      onChange={(e) => {
                        const archivo = e.target.files?.[0];
                        if (archivo) subirArchivo(archivo, campo, tabla!, registroId!);
                      }}
                      className={styles.inputArchivo}
                    />
                    {subiendo === campo.nombre && <p>Subiendo archivo...</p>}
                    {renderValor(campo, valores[campo.nombre])}
                  </div>
                ) : campo.tipo === 'icono' ? (
                  
                  <IconSelector
                    valor={valores[campo.nombre]}
                    onChange={(valor) => onChange?.(campo.nombre, valor)}
                  />
                ) 
                
                : (
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

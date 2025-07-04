'use client';

import { useEffect, useState, useRef } from 'react';
import styles from './SelectorTablaPopup.module.css';
import * as LucideIcons from 'lucide-react';
type Opcion = {
  label: string;
  value: number; // Aseguramos que siempre sea número
  icono?: string;
  color?: string;
};

type Props = {
  tabla: string;
  campoLabel: string;
  campoValue: string;
  label?: string;
  valorSeleccionado?: number | number[];
  onChange: (valor: number | number[]) => void;
  multiple?: boolean;
};

const SelectorTabla: React.FC<Props> = ({
  tabla,
  campoLabel,
  campoValue,
  label,
  valorSeleccionado,
  onChange,
  multiple = false,
}) => {
  const [opciones, setOpciones] = useState<Opcion[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [TieneIconoColor, setTieneIconoColor] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cargar = async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${tabla}`);
      const data = await res.json();
      const TieneIconoColor = data.length > 0 && data[0].icono && data[0].color;
      const lista = data.map((item: any) => ({
        label: item[campoLabel],
        value: Number(item[campoValue]), // ← aseguramos tipo number
        icono: item.icono,
        color: item.color,
      }));
      setOpciones(lista);
      if (data.length > 0 && data[0].icono && data[0].color) {
      setTieneIconoColor(true);
}
    };
    cargar();
  }, [tabla, campoLabel, campoValue]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mostrarValor = () => {
    if (multiple && Array.isArray(valorSeleccionado)) {
      return opciones
        .filter((op) => valorSeleccionado.includes(op.value))
        .map((op) => op.label)
        .join(', ');
    }
    const seleccionado = opciones.find((op) => String(op.value) === String(valorSeleccionado));
    return seleccionado?.label || 'Selecciona...';
  };

  const seleccionar = (valor: string | number) => {
    const valorFinal = Number(valor); // ← aseguramos que se pase como número

    if (multiple && Array.isArray(valorSeleccionado)) {
      const existe = valorSeleccionado.includes(valorFinal);
      const actualizado = existe
        ? valorSeleccionado.filter((v) => v !== valorFinal)
        : [...valorSeleccionado, valorFinal];
      onChange(actualizado);
    } else {
      onChange(valorFinal);
      setAbierto(false);
    }
  };
  

  const filtradas = opciones.filter((op) =>
    op.label.toLowerCase().includes(filtro.toLowerCase())
  );

  const renderIconoLucide = (icono?: string, color?: string) => {
  if (!icono) return null;
  const Icono = (LucideIcons as any)[icono];
  return Icono ? <Icono size={18} color={color || '#000'} /> : <LucideIcons.Circle size={18} color="#ccc" />;
};

  return (
    <div className={styles.wrapper} ref={ref}>
      {label && <label>{label}</label>}
      <div className={styles.selector} onClick={() => setAbierto(!abierto)}>
        {mostrarValor()}
      </div>

      {abierto && (
  <>
    <div className={styles.backdrop} />
    <div className={styles.popup}>
      <input
        type="text"
        placeholder="Buscar..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className={styles.busqueda}
      />
      <ul className={styles.lista}>
        {filtradas.map((op) => (
          <li
              key={op.value}
              className={`${styles.item} ${
                multiple && Array.isArray(valorSeleccionado) && valorSeleccionado.includes(op.value)
                  ? styles.activo
                  : !multiple && valorSeleccionado === op.value
                  ? styles.activo
                  : ''
              }`}
              onClick={() => seleccionar(op.value)}
            >
              {TieneIconoColor && op.icono && renderIconoLucide(op.icono, op.color)}
              <span style={{color: op.color, marginLeft: TieneIconoColor ? '0.5rem' : 0 }}>{op.label}</span>
          </li>
        ))}
      </ul>
    </div>
  </>
)}
    </div>
  );
};

export default SelectorTabla;

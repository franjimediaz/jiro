'use client';

import React from 'react';
import styles from './CrearPresupuestoBtn.module.css';
import { iconMap } from './utils/iconMap'; // ruta relativa si estás en app/, ajusta si es diferente

interface CrearPresupuestoBtnProps {
  clienteId: number;
  obraId: number;
  nombre?: string;
  descripcion?: string;
  onSuccess?: (presupuesto: any) => void;
  icono?: keyof typeof iconMap; // <-- ahora acepta string como 'FileText'
}

export default function CrearPresupuestoBtn({
  clienteId,
  obraId,
  nombre = 'Presupuesto sin título',
  descripcion = 'Descripción pendiente',
  onSuccess,
  icono = 'FileText',
}: CrearPresupuestoBtnProps) {
  const Icon = iconMap[icono]; // <-- extraemos el componente

  const handleClick = async () => {
    try {
      const res = await fetch('/presupuestos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clienteId,
          obraId,
          nombre,
          descripcion,
        }),
      });

      if (!res.ok) {
        throw new Error('Error al crear presupuesto');
      }

      const data = await res.json();
      alert('Presupuesto creado correctamente');
      onSuccess?.(data);
    } catch (error) {
      console.error(error);
      alert('Error al crear presupuesto');
    }
  };

  return (
    <button onClick={handleClick} className={styles.botonCrear}>
      {Icon && <Icon size={20} />}
      Crear Presupuesto
    </button>
  );
}

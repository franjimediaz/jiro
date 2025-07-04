'use client';

import React, { useEffect, useState } from 'react';
import styles from './TreeViewServiciosTareas.module.css';
import Link from 'next/link';

type Tarea = {
  id: number;
  nombre: string;
  descripcion: string;
};

type ServiciosTarea = {
  id: number;
  total?: number;
  fechaInicio?: string;
  fechaFin?: string;
  tarea?: Tarea;
};

type Servicio = {
  id: number;
  nombre: string;
  serviciosTarea: ServiciosTarea[];
};

type Props = {
  obraId: number;
};

const TreeViewServiciosTareas: React.FC<Props> = ({ obraId }) => {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [abierto, setAbierto] = useState<Record<number, boolean>>({});

  useEffect(() => {
  if (!obraId) return;
  const cargar = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/obras/${obraId}/servicios-tareas`);
      const data = await res.json();
      setServicios(data);
    } catch (err) {
      console.error('Error al cargar servicios y tareas:', err);
    }
  };
  cargar();
}, [obraId]);

  const toggle = (id: number) => {
    setAbierto((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  ////////////////////////////

  const handleEliminarServicio = async (servicioId: number) => {
  const confirmar = window.confirm('¿Eliminar este servicio y todas sus tareas?');
  if (!confirmar) return;

  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/servicios/${servicioId}`, {
      method: 'DELETE',
    });
    setServicios((prev) => prev.filter((s) => s.id !== servicioId));
  } catch (err) {
    console.error('Error al eliminar servicio:', err);
    alert('Error al eliminar el servicio.');
  }
};

const handleEliminarTarea = async (tareaId: number) => {
  const confirmar = window.confirm('¿Eliminar esta tarea?');
  if (!confirmar) return;

  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/obras/tareas/${tareaId}`, {
      method: 'DELETE',
    });

    // Actualizar lista eliminando solo la tarea borrada
    setServicios((prevServicios) =>
      prevServicios.map((s) => ({
        ...s,
        serviciosTarea: s.serviciosTarea.filter((st) => st.tarea?.id !== tareaId),
      }))
    );
  } catch (err) {
    console.error('Error al eliminar tarea:', err);
    alert('Error al eliminar la tarea.');
  }
};


////////////////////////////////////////////

  return (
    <div className={styles.contenedor}>
  <div className={styles.header}>
    <h3>Servicios y Tareas</h3>
    <Link href={`/obras/servicios/createSOT?obraId=${obraId}`} className={styles.btnCrear}>
      + Añadir servicio
    </Link>
  </div>

  <ul className={styles.lista}>
    {servicios.map((serv) => {
      const totalServicio = (serv.serviciosTarea ?? []).reduce(
        (acc, st) => acc + (st.total || 0),
        0
      );
////💰
      return (
        <li key={serv.id}>
          <div className={styles.nodo}>
            <span onClick={() => toggle(serv.id)} className={styles.toggle}>
              {abierto[serv.id] ? '▾' : '▸'}
            </span>
            <span className={styles.descripcion}>{serv.nombre}</span>
            <span className={styles.totalServicio}>Total: {totalServicio.toFixed(2)} € </span>
            <Link
              href={`/obras/tareas/create?servicioId=${serv.id}&obraId=${obraId}`}
              className={styles.btnTarea}
            >
              + Tarea
            </Link>
            <button
              className={styles.btnEliminarServicio}
              onClick={() => handleEliminarServicio(serv.id)}
            >
              🗑️
            </button>
          </div>

          {abierto[serv.id] && (
  <ul className={styles.sublista}>
    {(serv.serviciosTarea ?? []).map((st) => (
              <li key={st.id} className={styles.tarea}>
                <Link
                  href={`/obras/tareas/create?obraId=${obraId}&servicioId=${serv.id}&servicioTareaId=${st.id}`}
                  className={styles.tareaNombre}
                >
                  {st.tarea?.nombre || 'Tarea sin nombre'}
                </Link>
                <span className={styles.fechas}>
                  ({st.fechaInicio?.substring(0, 10)} → {st.fechaFin?.substring(0, 10)})
                </span>
                <span className={styles.totalTarea}>
                   {st.total?.toFixed(2) ?? "0.00"} €
                </span>
                <button
                  className={styles.btnEliminarTarea}
                  onClick={() => handleEliminarTarea(st.tarea?.id ?? 0)}
                >
                  🗑️
                </button>
              </li>
            ))}
          </ul>
        )}
        </li>
      );
    })}
  </ul>
</div>

  );
};

export default TreeViewServiciosTareas;

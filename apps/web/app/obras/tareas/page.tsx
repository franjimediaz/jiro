'use client';

import { useEffect, useState } from 'react';
import TablaListado from '../../components/TablaListado';
import styles from './Tareas.module.css';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

type Tareas = {
  id: number;
  nombre: string;
  estado: string;
  servicio:string;
};

export default function TareasPage() {
  const [tareas, setTareas] = useState<Tareas[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const obraId = searchParams.get('obraId');
  const servicioId = searchParams.get('servicioId');

useEffect(() => {
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/obras/tareas`)
    .then((res) => res.json())
    .then((data) => {
      console.log('📦 Datos recibidos desde backend:', data);
      if (Array.isArray(data)) {
        setTareas(data);
      } else {
        console.error('❌ Error: los datos no son un array:', data);
        setTareas([]);
        alert('No se encontraron tareas o la respuesta del servidor es incorrecta');
      }
      setLoading(false);
    })
    .catch((err) => {
      console.error('Error al obtener tareas:', err);
      setLoading(false);
    });
}, []);


  const handleEliminar = (tarea: Tareas) => {
  if (!tarea?.id || isNaN(Number(tarea.id))) {
    alert('ID de tarea no válido');
    return;
  }

  if (confirm(`¿Eliminar tarea "${tarea.nombre}"?`)) {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/obras/tareas/${tarea.id}`, {
      method: 'DELETE',
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error al eliminar tarea');
        return res.json();
      })
      .then(() => {
        setTareas((prev) => prev.filter((o) => o.id !== tarea.id));
        alert('Tarea eliminada');
      })
      .catch((err) => {
        console.error('❌ Error al eliminar tarea:', err);
        alert('Error al eliminar la tarea');
      });
  }
};

  const columnas = [
    { clave: 'nombre', encabezado: 'Nombre' },
    { clave: 'estado', encabezado: 'Estado' },
    { clave: 'servicioTarea', encabezado: 'Dirección' },
  ];

  return (
    <main>
      <div className={styles.tareasContainer}>
        <div className={styles.header}>
          <h1>Listado de tareas</h1>
        {/**   <button
            className={styles.botonCrear}
            onClick={() => router.push('/obras/tareas/create')}
          >
            + Crear Tareas
          </button>*/}
        </div>

        {loading ? (
          <p>Cargando tareas...</p>
        ) : (
          <TablaListado
            titulo=""
            columnas={columnas}
            datos={tareas}
            onVer={(tarea) => router.push(`/obras/tareas/${tarea.id}`)}
            onEditar={(tarea) => router.push(`/obras/tareas/${tarea.id}?edit=true`)}
            onEliminar={handleEliminar}

          />
        )}
      </div>
    </main>
  );
}

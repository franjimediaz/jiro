'use client';

import { useEffect, useState } from 'react';
import TablaListado from '../components/TablaListado';
import styles from './Obras.module.css'; // o donde tengas el CSS
import { useRouter } from 'next/navigation';


type Obra = {
  id: number;
  nombre: string;
  direccion: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
};

export default function ObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // ← Aquí

  useEffect(() => {
    fetch('http://localhost:3001/obras')
      .then(res => res.json())
      .then(data => {
        setObras(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error al obtener obras:', err);
        setLoading(false);
      });
  }, []);

  const columnas = [
    { clave: 'nombre', encabezado: 'Nombre' },
    { clave: 'direccion', encabezado: 'Dirección' },
    { clave: 'estado', encabezado: 'Estado' },
    {
      clave: 'fechaInicio',
      encabezado: 'Inicio',
      render: (valor: string) => new Date(valor).toLocaleDateString(),
    },
    {
      clave: 'fechaFin',
      encabezado: 'Fin',
      render: (valor: string) => new Date(valor).toLocaleDateString(),
    },
  ];

  return (
    <main>
      <div className={styles.obrasContainer}>
        <div className={styles.header}>
          <h1>Listado de Obras</h1>
          <button
            className={styles.botonCrear}
            onClick={() => router.push('/obras/create')}
          >
            + Crear Obra
          </button>
        </div>

        {loading ? (
          <p>Cargando obras...</p>
        ) : (
          <TablaListado
            titulo=""
            columnas={columnas}
            datos={obras}
            onVer={(obra) => alert(`Ver obra ID ${obra.id}`)}
            onEditar={(obra) => alert(`Editar obra ID ${obra.id}`)}
            onEliminar={(obra) => alert(`Eliminar obra ID ${obra.id}`)}
          />
        )}
      </div>
    </main>
  );
}


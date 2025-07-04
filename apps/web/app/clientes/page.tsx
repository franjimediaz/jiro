'use client';

import { useEffect, useState } from 'react';
import TablaListado from '../components/TablaListado';
import styles from './clientes.module.css'; 
import { useRouter } from 'next/navigation';


type Clientes = {
  id: number;
  nombre: string;
  apellido: string;
  direccion: string;
  email: string;
  telefono: string;
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Clientes[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // ← Aquí

useEffect(() => {
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/clientes`)
    .then(res => res.json())
    .then(data => {
      console.log("Respuesta del backend:", data);
      if (Array.isArray(data)) {
        setClientes(data);
      } else if (Array.isArray(data.clientes)) {
        setClientes(data);
      } else {
        console.error(" Los datos no son un array:", data);
      }
      setLoading(false);
    })
    .catch(err => {
      console.error('Error al obtener clientes:', err);
      setLoading(false);
    });
}, []);



  const handleEliminar = (clientes: any) => {
    if (confirm(`¿Eliminar clientes "${clientes.nombre}"?`)) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/clientes/${clientes.id}`, {
        method: 'DELETE',
      })
        .then(() => {
          setClientes((prev) => prev.filter((o) => o.id !== clientes.id));
          alert('cliente eliminado');
        })
        .catch(() => alert('Error al eliminar'));
    }
  };

  const columnas = [
    { clave: 'nombre', encabezado: 'Nombre' },
    { clave: 'direccion', encabezado: 'Dirección' },
    { clave: 'email', encabezado: 'Email' },
  ];

  return (
    <main>
      <div className={styles.clientesContainer}>
        <div className={styles.header}>
          <h1>Listado de clientes</h1>
          <button
            className={styles.botonCrear}
            onClick={() => router.push('/clientes/create')}
          >
            + Crear clientes
          </button>
        </div>

        {loading ? (
          <p>Cargando clientes...</p>
        ) : (
          <TablaListado
            titulo=""
            columnas={columnas}
            datos={clientes}
            onVer={(clientes) => router.push(`/clientes/${clientes.id}`)}
            onEditar={(clientes) => router.push(`/clientes/${clientes.id}?edit=true`)}
            onEliminar={handleEliminar}
          />
        )}
      </div>
    </main>
  );
}


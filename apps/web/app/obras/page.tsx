'use client';

import { useEffect, useState } from 'react';
import TablaListado from '../components/TablaListado';

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
    {loading ? (
      <p>Cargando obras...</p>
    ) : (
      <TablaListado
        titulo="Listado de Obras"
        columnas={columnas}
        datos={obras}
        onVer={(obra) => alert(`Ver obra ID ${obra.id}`)}
        onEditar={(obra) => alert(`Editar obra ID ${obra.id}`)}
        onEliminar={(obra) => alert(`Eliminar obra ID ${obra.id}`)}
      />
    )}
  </main>
);
}

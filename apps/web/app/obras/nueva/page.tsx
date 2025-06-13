'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormularioTabla from '../../components/FormularioTabla';

const campos = [
  { nombre: 'nombre', etiqueta: 'Nombre de la obra' },
  { nombre: 'direccion', etiqueta: 'Dirección' },
  { nombre: 'fechaInicio', etiqueta: 'Fecha de inicio', tipo: 'date' },
  { nombre: 'fechaFin', etiqueta: 'Fecha de fin', tipo: 'date' },
  { nombre: 'estado', etiqueta: 'Estado' },
];

export default function NuevaObra() {
  const router = useRouter();

  const [valores, setValores] = useState({
    nombre: '',
    direccion: '',
    fechaInicio: '',
    fechaFin: '',
    estado: '',
  });

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    const res = await fetch('http://localhost:3001/obras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(valores),
    });

    if (res.ok) {
      alert('Obra creada correctamente');
      router.push('/obras');
    } else {
      alert('Error al crear la obra');
    }
  };

  return (
    <FormularioTabla
      titulo="Crear Nueva Obra"
      campos={campos}
      valores={valores}
      onChange={handleChange}
      onSubmit={handleSubmit}
      botonTexto="Crear"
    />
  );
}

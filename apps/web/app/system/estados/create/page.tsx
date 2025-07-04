'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormularioTabla from '../../../components/FormularioTabla';

const campos = [
  { nombre: 'nombre', etiqueta: 'Nombre del Estado', placeholder: 'Ej. En curso' },
  { nombre: 'color', etiqueta: 'Color', placeholder: '#FFAA00', tipo: 'color' },
  { nombre: 'icono', etiqueta: 'Icono', placeholder: 'fa-hammer', tipo: 'icono' },
];

const CrearEstado = () => {
  const router = useRouter();
  const [valores, setValores] = useState({
    nombre: '',
    color: '',
    icono: '',
  });

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/estados`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valores),
      });

      if (!res.ok) throw new Error('Error al crear el Estado');

      router.back(); // o router.push('/Estados') si tienes listado
    } catch (error) {
      console.error('Error al crear Estado:', error);
    }
  };

  return (
    <FormularioTabla
      titulo="Crear Estado"
      campos={campos}
      valores={valores}
      onChange={handleChange}
      onSubmit={handleSubmit}
      botonTexto="Crear Estado"
    />
  );
};

export default CrearEstado;

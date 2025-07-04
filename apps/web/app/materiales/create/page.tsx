'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormularioTabla from '../../components/FormularioTabla';


const campos = [
  { nombre: 'nombre', etiqueta: 'Nombre del material' },
  { nombre: 'descripcion', etiqueta: 'Descripción' },
  { nombre: 'precio', etiqueta: 'Precio' },
  { nombre: 'proveedor', etiqueta: 'Proveedor'},
  { nombre: 'stockActual', etiqueta: 'Stock' },
  { nombre: 'unidadMedida', etiqueta: 'Unidad', tipo:'select' },

];

export default function Nuevamaterial() {
  const router = useRouter();

  const [valores, setValores] = useState({
    nombre: '',
    direccion: '',
    fechaInicio: '',
    fechaFin: '',
    estado: '',
    clienteID:'',
  });

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/materiales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(valores),
    });

    if (res.ok) {
      alert('material creada correctamente');
      router.push('/materiales');
    } else {
      alert('Error al crear la material');
    }
  };

  return (
    <FormularioTabla
      titulo="Crear Nuevo material"
      campos={campos}
      valores={valores}
      onChange={handleChange}
      onSubmit={handleSubmit}
      botonTexto="Crear"
    />
  );
}

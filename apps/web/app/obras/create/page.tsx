'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormularioTabla from '../../components/FormularioTabla';

const campos = [
  { nombre: 'nombre', etiqueta: 'Nombre de la obra' },
  { nombre: 'direccion', etiqueta: 'Dirección' },
  { nombre: 'fechaInicio', etiqueta: 'Fecha de inicio', tipo: 'date' },
  { nombre: 'fechaFin', etiqueta: 'Fecha de fin', tipo: 'date' },
    {
    nombre: 'estadoId',
    etiqueta: 'Estado',
    tipo: 'selectorTabla',
    tabla: 'estados',
    campoLabel: 'nombre',
    campoValue: 'id',
  },
  {
    nombre: 'clienteId',
    etiqueta: 'Cliente',
    tipo: 'selectorTabla',
    tabla: 'clientes',
    campoLabel: 'nombre',
    campoValue: 'id',
  },

];

export default function NuevaObra() {
  const router = useRouter();

  const [valores, setValores] = useState({
    nombre: '',
    direccion: '',
    fechaInicio: '',
    fechaFin: '',
    estadoId: '',
    clienteId:'',
  });

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
  console.log('Datos a enviar:', valores); // 👈 AÑADE ESTE LOG

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/obras`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(valores),
  });

  const data = await res.json();
  console.log('Respuesta del backend:', data); // 👈 AÑADE ESTE LOG

  if (res.ok) {
    alert('Obra creada correctamente');
    router.push('/obras');
  } else {
    alert(`Error al crear la obra: ${data?.detalle}`);
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

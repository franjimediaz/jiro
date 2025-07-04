
'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import FormularioTabla from '../../../components/FormularioTabla';

const campos = [
  { nombre: 'servicioId', etiqueta: 'Servicio', tipo: 'selectorTabla', tabla: 'servicios', campoLabel: 'nombre', multiple: false, campoValue: 'id', },
  { nombre: 'fechaInicio', etiqueta: 'Fecha inicio', tipo: 'date' },
  { nombre: 'fechaFin', etiqueta: 'Fecha fin', tipo: 'date' },
];

export default function CrearServicioObra() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const obraId = searchParams.get('obraId');

  const [valores, setValores] = useState<any>({
    servicioId: '',
    fechaInicio: '',
    fechaFin: '',
    
  });

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev: any) => ({ ...prev, [nombre]: valor }));
  };

const handleSubmit = async () => {
  if (!obraId) {
    alert('Falta el ID de la obra.');
    return;
  }

  try {
    // Paso 1: Crear la tarea vacía
    const resTarea = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/obras/tareas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Tarea sin nombre',
        descripcion: 'Descripción pendiente',
        estadoId: 1, // o el ID de estado por defecto
      }),
    });

    if (!resTarea.ok) {
      throw new Error('Error al crear tarea');
    }

    const tareaCreada = await resTarea.json();

    // Paso 2: Crear la relación servicio_tarea
    const payload = {
      obraId: Number(obraId),
      servicioId: Number(valores.servicioId),
      tareaId: tareaCreada.id,
      fechaInicio: valores.fechaInicio,
      fechaFin: valores.fechaFin,
    };

    console.log('Payload a enviar:', payload);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/servicios_tarea`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert('Servicio añadido a la obra');
      router.push(`/obras/${obraId}`);
    } else {
      alert('Error al crear relación servicio-tarea');
    }
  } catch (err) {
    console.error('❌ Error en handleSubmit:', err);
    alert('Error al crear servicio y tarea');
  }
};


  return (
    <FormularioTabla
      titulo="Añadir Servicio"
      campos={campos}
      valores={valores}
      onChange={handleChange}
      onSubmit={handleSubmit}
    />
  );
}

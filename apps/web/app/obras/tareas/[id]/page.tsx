'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import FormularioTabla from '../../../components/FormularioTabla';

const campos = [
  { nombre: 'nombre', etiqueta: 'Nombre de la Tarea' },
  { nombre: 'descripcion', etiqueta: 'Descripción' },
  { nombre: 'estado', etiqueta: 'Estado' },
  { nombre: 'fechaInicio', etiqueta: 'Fecha de inicio', tipo: 'date' },
  { nombre: 'fechaFin', etiqueta: 'Fecha de fin', tipo: 'date' },
  { nombre: 'precioManoObra', etiqueta: 'Mano de Obra' },
  { nombre: 'cantidadMateriales', etiqueta: 'Cantidad' },
  { nombre: 'precioMateriales', etiqueta: 'Precio materiales' },
  { nombre: 'total', etiqueta: 'Total', tipo: 'readonly' }
];

export default function VerEditarTarea() {
  const router = useRouter();
  const { id } = useParams();
  const searchParams = useSearchParams();
  const modoEdicion = searchParams.get('edit') === 'true';

  const [valores, setValores] = useState<any>({
    nombre: '',
    descripcion: '',
    estado: '',
    fechaInicio: '',
    fechaFin: '',
    precioManoObra: '',
    cantidadMateriales: '',
    precioMateriales: '',
    total: ''
  });

  // Calculamos el total automáticamente
  useEffect(() => {
    const manoObra = parseFloat(valores.precioManoObra || 0);
    const cantidad = parseFloat(valores.cantidadMateriales || 0);
    const precioMat = parseFloat(valores.precioMateriales || 0);
    const total = manoObra + cantidad * precioMat;
    setValores((prev: any) => ({ ...prev, total: total.toFixed(2) }));
  }, [valores.precioManoObra, valores.cantidadMateriales, valores.precioMateriales]);

  // Cargamos los datos de la tarea
  useEffect(() => {
    if (!id) return;
    const cargarTarea = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tareas/${id}`);
        if (!res.ok) throw new Error('No se pudo cargar la tarea');
        const data = await res.json();
        setValores({
          nombre: data.nombre || '',
          descripcion: data.descripcion || '',
          estado: data.estado || '',
          fechaInicio: data.fechaInicio?.substring(0, 10) || '',
          fechaFin: data.fechaFin?.substring(0, 10) || '',
          precioManoObra: data.precioManoObra?.toString() || '',
          cantidadMateriales: data.cantidadMateriales?.toString() || '',
          precioMateriales: data.precioMateriales?.toString() || '',
          total: data.total?.toFixed(2) || '0.00'
        });
      } catch (err) {
        console.error('Error al cargar tarea:', err);
        alert('Error cargando tarea');
      }
    };
    cargarTarea();
  }, [id]);

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev: any) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/obras/tareas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: valores.nombre,
          descripcion: valores.descripcion,
          estado: valores.estado
        })
      });

      if (!res.ok) throw new Error('No se pudo actualizar');
      alert('Tarea actualizada correctamente');
      router.push('/obras/tareas');
    } catch (error) {
      console.error('Error al actualizar:', error);
      alert('Error al actualizar la tarea');
    }
  };

  return (
    <FormularioTabla
      titulo={modoEdicion ? 'Editar Tarea' : 'Detalle de Tarea'}
      campos={campos.map((campo) => ({
        ...campo,
        readOnly: !modoEdicion || campo.tipo === 'readonly'
      }))}
      valores={valores}
      onChange={handleChange}
      onSubmit={modoEdicion ? handleSubmit : undefined}
      botonTexto={modoEdicion ? 'Guardar Cambios' : undefined}
    />
  );
}

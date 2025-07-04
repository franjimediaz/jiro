'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import FormularioTabla from '../../components/FormularioTabla';
import TreeViewServiciosTareas from '../../components/TreeViewServiciosTareas/TreeViewServiciosTareas';
import CrearPresupuestoBtn from '../../components/CrearPresupuestoBtn';




const campos = [
  { nombre: 'nombre', etiqueta: 'Nombre de la obra' },
  { nombre: 'direccion', etiqueta: 'Dirección' },
  { nombre: 'fechaInicio', etiqueta: 'Fecha de inicio', tipo: 'date' },
  { nombre: 'fechaFin', etiqueta: 'Fecha de fin', tipo: 'date' },
  { nombre: 'estadoId',
    etiqueta: 'Estado',
    tipo: 'selectorTabla',
    tabla: 'estados',
    campoLabel: 'nombre',
    campoValue: 'id',},
  {
    nombre: 'clienteId',
    etiqueta: 'Cliente',
    tipo: 'selectorTabla',
    tabla: 'clientes',
    campoLabel: 'nombre',
    campoValue: 'id',
  },
];

export default function VerEditarObra() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const modoEdicion = searchParams.get('edit') === 'true';
  const [valores, setValores] = useState({
    nombre: '',
    direccion: '',
    fechaInicio:'',
    fechaFin:'',
    email: '',
    telefono: '',
    clienteId: '',
  });
  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/Obras/${id}`)
      .then(res => res.json())
      .then(data => {
        setValores(data);
        setCargando(false);
        const obraFormateada = {
          ...data,
          fechaInicio: data.fechaInicio?.split('T')[0],
          fechaFin: data.fechaFin?.split('T')[0],
        };

        setValores(obraFormateada);
        setCargando(false);
      })
      .catch(err => {
        console.error('Error al obtener Obra:', err);
        setCargando(false);
      });
  }, [id]);

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/obras/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(valores),
    });

    if (res.ok) {
      alert('Obra actualizado');
      router.push('/obras');
    } else {
      alert('Error al actualizar');
    }
  };
  const generarPresupuesto = async () => {
    if (!valores.nombre || !valores.clienteId) {
      alert('Faltan datos de la obra');
      return;
    }

    setGenerando(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/presupuestos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: `Presupuesto para ${valores.nombre}`,
          descripcion: `Presupuesto generado desde la obra "${valores.nombre}"`,
          clienteId: valores.clienteId,
          obraId: Number(id),
        }),
      });

      if (!res.ok) throw new Error('Error al generar presupuesto');

      const data = await res.json();
      router.push(`/presupuestos/${data.id}?edit=true`);
    } catch (err) {
      console.error(err);
      alert('No se pudo generar el presupuesto');
    } finally {
      setGenerando(false);
    }
  };

  if (cargando) return <p>Cargando Obra...</p>;

  return (
    <div>
    <FormularioTabla
      titulo={modoEdicion ? 'Editar Obra' : 'Detalle del Obra'}
      campos={campos}
      valores={valores}
      onChange={modoEdicion ? handleChange : undefined}
      onSubmit={modoEdicion ? handleSubmit : undefined}
      botonTexto="Guardar cambios"
      soloLectura={!modoEdicion}
    />
    {!cargando && valores.clienteId && (
      <div className="boton-presupuesto-wrapper">
      <CrearPresupuestoBtn
        clienteId={Number(valores.clienteId)}
        obraId={Number(id)}
        nombre={`Presupuesto para ${valores.nombre}`}
        descripcion={`Presupuesto generado desde la obra "${valores.nombre}"`}
        onSuccess={(presupuesto) => {
          console.log('Presupuesto creado:', presupuesto);
          router.push(`/presupuestos/${presupuesto.id}?edit=true`);
        }}
      />
      </div>
    )}
    {!cargando && id && (
      <TreeViewServiciosTareas obraId={Number(id)} />
    )}
    
    </div>
  );
}
